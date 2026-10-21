'use client';

import React from 'react';
import { sanitizeText } from '@/lib/security/evidence-sanitizer';
import type { PrivacyClause, PrivacySectionId, ClauseStatus, DataBoundary, NetworkType } from '@/app/types/privacy';
import { PRIVACY_SECTION_DESCRIPTIONS } from '@/app/types/privacy';

interface PrivacySectionProps {
  clause: PrivacyClause;
  sectionId: PrivacySectionId;
  network: NetworkType;
}

const STATUS_BADGES: Record<ClauseStatus, { label: string; className: string; ariaLabel: string }> = {
  approved: {
    label: 'Approved',
    className: 'bg-green-900/30 text-green-400 border-green-700',
    ariaLabel: 'This clause has been approved and is legally effective',
  },
  review: {
    label: 'Under Review',
    className: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    ariaLabel: 'This clause is under review and not yet legally effective',
  },
  unavailable: {
    label: 'Unavailable',
    className: 'bg-red-900/30 text-red-400 border-red-700',
    ariaLabel: 'This clause is currently unavailable',
  },
};

const BOUNDARY_BADGES: Record<
  DataBoundary,
  { label: string; className: string; ariaLabel: string; callout: string }
> = {
  'immutable-chain': {
    label: 'Immutable On-Chain',
    className: 'bg-cyan-950/40 text-cyan-300 border-cyan-600/70',
    ariaLabel: 'Data Boundary: Immutable On-Chain',
    callout:
      'Immutable Ledger Record: Data in this category is committed directly to the blockchain or distributed IPFS network. Once confirmed by consensus, it cannot be altered, rewritten, or erased.',
  },
  'controllable-off-chain': {
    label: 'Controllable Off-Chain',
    className: 'bg-emerald-950/40 text-emerald-300 border-emerald-600/70',
    ariaLabel: 'Data Boundary: Controllable Off-Chain',
    callout:
      'Controllable Record: Stored in off-chain databases, temporary queues, or client-side storage. Subject to scheduled retention limits and user erasure/rectification requests.',
  },
};

export function PrivacySection({ clause, sectionId, network }: PrivacySectionProps) {
  const statusInfo = STATUS_BADGES[clause.status];
  const boundaryInfo = BOUNDARY_BADGES[clause.dataBoundary];

  const safeContent = sanitizeText(clause.content, 10000);
  const safeTitle = sanitizeText(clause.title, 200);
  const safeReviewerNotes = clause.reviewerNotes ? sanitizeText(clause.reviewerNotes, 1000) : null;

  const lines = safeContent.split('\n').filter((line) => line.trim().length > 0);

  return (
    <section
      id={clause.id}
      data-testid={clause.id}
      data-boundary={clause.dataBoundary}
      className="space-y-4 pb-8 border-b border-divider last:border-0"
      aria-labelledby={`${clause.id}-title`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 id={`${clause.id}-title`} className="tb-section text-ink font-semibold">
            {safeTitle}
          </h2>
          <p className="tb-small text-ink-muted">{PRIVACY_SECTION_DESCRIPTIONS[sectionId]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Data Boundary Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${boundaryInfo.className}`}
            aria-label={boundaryInfo.ariaLabel}
          >
            {boundaryInfo.label}
          </span>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.className}`}
            aria-label={statusInfo.ariaLabel}
          >
            {statusInfo.label}
          </span>

          {/* Network Badge */}
          {network === 'testnet' && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-900/30 text-blue-400 border-blue-700"
              aria-label="Testnet notice — Optimism Sepolia"
            >
              Testnet
            </span>
          )}
          {network === 'mainnet' && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-info/10 text-info border-info/30"
              aria-label="Mainnet notice — Optimism Mainnet"
            >
              Mainnet
            </span>
          )}
        </div>
      </div>

      {/* Content paragraphs */}
      <div className="prose prose-invert max-w-none tb-body text-ink-secondary space-y-3">
        {lines.map((line, index) => (
          <p key={index} className="whitespace-pre-wrap break-words">
            {line}
          </p>
        ))}
      </div>

      {/* Boundary Callout Box */}
      <div
        className={`p-3 rounded-lg border text-xs ${
          clause.dataBoundary === 'immutable-chain'
            ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-200'
            : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
        }`}
        role="note"
        aria-label={`Boundary notice for ${safeTitle}`}
      >
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{boundaryInfo.callout}</p>
        </div>
      </div>

      {/* Last Reviewed Timestamp */}
      {clause.lastReviewedAt && (
        <div className="tb-label text-ink-muted flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Last reviewed:{' '}
            {(() => {
              const d = new Date(clause.lastReviewedAt!);
              return isNaN(d.getTime()) ? clause.lastReviewedAt! : d.toLocaleDateString();
            })()}
          </span>
        </div>
      )}

      {/* Reviewer Notes for clauses under review */}
      {clause.status === 'review' && safeReviewerNotes && (
        <div
          className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-700"
          role="note"
          aria-label="Reviewer notes"
        >
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="tb-label text-yellow-400 font-semibold">Reviewer Notes</p>
              <p className="tb-small text-yellow-300 mt-1">{safeReviewerNotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Unavailable State Alert */}
      {clause.status === 'unavailable' && (
        <div
          className="p-3 rounded-lg bg-red-900/20 border border-red-700"
          role="alert"
          aria-label="Clause unavailable"
        >
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="tb-label text-red-400 font-semibold">Clause Unavailable</p>
              <p className="tb-small text-red-300 mt-1">
                This privacy clause is currently unavailable. It may be pending formal legal review, regulatory
                approval, or governance ratification.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
