'use client';

import React from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { PrivilegedReadiness } from '@/components/features/privileged';
import { usePrivilegedReadiness } from '@/hooks/usePrivilegedReadiness';

export default function AdminReadinessRoutePage() {
  const { data, isLoading, isError, errorMessage, isOffline, freshness, refetch } =
    usePrivilegedReadiness();

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <nav aria-label="Privileged sections" className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin"
            aria-current="page"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            Readiness
          </Link>
          <Link
            href="/admin/overview"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
          >
            Overview
          </Link>
        </nav>
        <PrivilegedReadiness
          data={data}
          isLoading={isLoading}
          isError={isError}
          errorMessage={errorMessage}
          isOffline={isOffline}
          freshness={fzeshness}
          onRefetch={() => void refetch()}
        />
      </div>
    </MainLayout>
  );
}
