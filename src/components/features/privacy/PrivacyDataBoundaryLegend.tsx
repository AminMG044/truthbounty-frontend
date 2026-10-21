'use client';

import React from 'react';

interface PrivacyDataBoundaryLegendProps {
  className?: string;
}

export function PrivacyDataBoundaryLegend({ className = '' }: PrivacyDataBoundaryLegendProps) {
  return (
    <aside
      className={`p-5 rounded-xl border border-divider bg-surface/60 space-y-4 ${className}`}
      aria-labelledby="data-boundary-heading"
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-action"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <h2 id="data-boundary-heading" className="tb-section text-ink font-semibold">
          Data Architecture & Boundary Classification
        </h2>
      </div>

      <p className="tb-small text-ink-muted">
        TruthBounty strictly delineates between <strong>Immutable On-Chain Data</strong> broadcast to public
        decentralized consensus and <strong>Controllable Off-Chain Data</strong> subject to standard erasure and retention controls.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Immutable Chain Card */}
        <div
          className="p-4 rounded-lg border border-cyan-700/50 bg-cyan-950/20 space-y-2"
          role="group"
          aria-label="Immutable on-chain data boundary explanation"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-cyan-900/40 text-cyan-300 border-cyan-600"
              aria-label="Boundary: Immutable On-Chain"
            >
              Immutable On-Chain
            </span>
            <span className="tb-small font-medium text-cyan-200">Public & Permanent</span>
          </div>
          <p className="tb-small text-ink-secondary">
            Committed to Optimism blockchain consensus or decentralized IPFS mirrors. Records include public wallet
            addresses, transaction hashes, claim declarations, vote commitments, and evidence content hashes.
          </p>
          <p className="tb-small text-cyan-300/80 font-mono text-xs">
            Notice: Cannot be modified, overwritten, or erased by any interface operator.
          </p>
        </div>

        {/* Controllable Off-Chain Card */}
        <div
          className="p-4 rounded-lg border border-emerald-700/50 bg-emerald-950/20 space-y-2"
          role="group"
          aria-label="Controllable off-chain data boundary explanation"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-900/40 text-emerald-300 border-emerald-600"
              aria-label="Boundary: Controllable Off-Chain"
            >
              Controllable Off-Chain
            </span>
            <span className="tb-small font-medium text-emerald-200">Expungeable & Managed</span>
          </div>
          <p className="tb-small text-ink-secondary">
            Stored in client browser storage, temporary support ticket databases, or opt-in sanitized diagnostic logs.
            Information is strictly aged out under scheduled retention policies.
          </p>
          <p className="tb-small text-emerald-300/80 font-mono text-xs">
            Notice: Subject to data subject access, rectification, and deletion requests.
          </p>
        </div>
      </div>
    </aside>
  );
}
