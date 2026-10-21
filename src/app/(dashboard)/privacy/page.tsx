import { Metadata } from 'next';
import { getPrivacyMetadata, getPrivacy } from '@/data/privacy';
import { PrivacyPageClient } from './PrivacyPageClient';

interface PrivacyPageProps {
  params: Promise<{ network?: string; version?: string }>;
  searchParams: Promise<{ network?: string; version?: string }>;
}

function isValidNetwork(network: string): network is 'testnet' | 'mainnet' {
  return network === 'testnet' || network === 'mainnet';
}

export async function generateMetadata({ params, searchParams }: PrivacyPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const networkParam = resolvedParams.network ?? resolvedSearchParams.network ?? 'testnet';
  const network = isValidNetwork(networkParam) ? networkParam : 'testnet';

  const metadata = getPrivacyMetadata(network);
  const currentVersion = getPrivacy(network, metadata.currentVersion);

  const networkLabel = network === 'testnet' ? 'Testnet (Optimism Sepolia)' : 'Mainnet (Optimism)';

  return {
    title: `Privacy Notice v${currentVersion.version} • ${networkLabel} • TruthBounty`,
    description: `TruthBounty ${networkLabel} Privacy Notice version ${currentVersion.version}, effective ${currentVersion.effectiveDate}. Delineates immutable blockchain data from controllable off-chain systems across 9 key areas.`,
    openGraph: {
      title: `Privacy Notice v${currentVersion.version} • ${networkLabel} • TruthBounty`,
      description: `TruthBounty ${networkLabel} Privacy Notice version ${currentVersion.version}`,
      type: 'website',
    },
  };
}

export default async function PrivacyPage({ params, searchParams }: PrivacyPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const networkParam = resolvedParams.network ?? resolvedSearchParams.network ?? 'testnet';
  const network = isValidNetwork(networkParam) ? networkParam : 'testnet';

  const versionParam = resolvedParams.version ?? resolvedSearchParams.version;

  const metadata = getPrivacyMetadata(network);
  const allVersions = metadata.versions;

  // Validate requested version exists for this network; fallback to current active
  let currentVersion: ReturnType<typeof getPrivacy>;
  if (versionParam && allVersions.some((v) => v.version === versionParam)) {
    currentVersion = getPrivacy(network, versionParam);
  } else {
    currentVersion = getPrivacy(network, metadata.currentVersion);
  }

  return (
    <PrivacyPageClient
      network={network}
      currentVersion={currentVersion}
      allVersions={allVersions}
    />
  );
}
