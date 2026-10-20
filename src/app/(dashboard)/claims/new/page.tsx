'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ClaimStatementForm from '@/components/features/claim-submission/ClaimStatementForm';
import { useDraftScope } from '@/hooks/useDraftScope';

export default function NewClaimPage() {
  const scope = useDraftScope();

  return (
    <MainLayout>
      <div className="min-h-full bg-background px-4 py-8 sm:px-6 lg:px-8">
        <ClaimStatementForm scope={scope} />
      </div>
    </MainLayout>
  );
}
