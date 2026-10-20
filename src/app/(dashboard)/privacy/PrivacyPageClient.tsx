'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PrivacyRenderer } from '@/components/features/privacy/PrivacyRenderer';
import type { PrivacyVersion, NetworkType } from '@/app/types/privacy';

interface PrivacyPageClientProps {
  network: NetworkType;
  currentVersion: PrivacyVersion;
  allVersions: PrivacyVersion[];
}

export function PrivacyPageClient({ network, currentVersion, allVersions }: PrivacyPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize selectedVersion from URL param or fallback to currentVersion
  const urlVersion = searchParams.get('version');
  const initialVersion =
    urlVersion && allVersions.some((v) => v.version === urlVersion)
      ? urlVersion
      : currentVersion.version;

  const [selectedVersion, setSelectedVersion] = React.useState(initialVersion);

  // Sync selectedVersion with URL param changes
  React.useEffect(() => {
    const paramVersion = searchParams.get('version');
    if (
      paramVersion &&
      paramVersion !== selectedVersion &&
      allVersions.some((v) => v.version === paramVersion)
    ) {
      setSelectedVersion(paramVersion);
    }
  }, [searchParams, selectedVersion, allVersions]);

  const versionToRender = allVersions.find((v) => v.version === selectedVersion) || currentVersion;

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    const params = new URLSearchParams(searchParams.toString());
    params.set('version', version);
    router.replace(`/privacy?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Skip link target */}
      <div id="main-content" tabIndex={-1} role="main" className="pt-8 pb-16">
        <PrivacyRenderer
          version={versionToRender}
          allVersions={allVersions}
          network={network}
          onVersionChange={handleVersionChange}
        />
      </div>
    </div>
  );
}
