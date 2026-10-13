'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useClaimDetailProjection } from '@/hooks/useClaimDetailProjection';
import {
  sanitizeEvidenceList,
  type RawEvidenceItem,
  type SafeEvidenceItem,
} from '@/lib/security/evidence-sanitizer';

export interface EvidenceViewerProps {
  claimId: string;
  /** Untrusted evidence items supplied by a canonical projection or caller. */
  evidence?: RawEvidenceItem[];
}

type ProjectionState = 'loading' | 'error' | 'ready-stale' | 'ready';

function EvidenceViewerContent({
  evidence,
  projectionState = 'ready',
  onRetry,
}: {
  evidence: SafeEvidenceItem[];
  projectionState?: ProjectionState;
  onRetry?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="card p-4 sm:p-6">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        aria-controls="evidence-content"
        className="flex items-center justify-between w-full font-semibold mb-3 text-base sm:text-lg text-left focus-visible:outline-2 focus-visible:outline-[#5b5bf6] focus-visible:outline-offset-2 rounded"
      >
        <span>Evidence</span>
        <span aria-hidden="true">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded ? (
        <div
          id="evidence-content"
          data-testid="evidence-scroll-container"
          className="space-y-3 sm:space-y-3 overflow-y-auto overscroll-contain"
          style={{ maxHeight: '60vh', overscrollBehavior: 'contain' }}
        >
          {projectionState === 'loading' ? (
            <p className="text-sm text-gray-500" role="status" aria-busy="true">
              Loading canonical evidence...
            </p>
          ) : null}
          {projectionState === 'error' ? (
            <div className="space-y-2" role="alert">
              <p className="text-sm text-red-500">Evidence projection unavailable.</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-sm text-blue-600 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  Try again
                </button>
              ) : null}
            </div>
          ) : null}
          {projectionState === 'ready-stale' ? (
            <p className="text-sm text-amber-700" role="status">
              Evidence projection may be outdated. Review before relying on it.
            </p>
          ) : null}
          {evidence.length === 0 && projectionState !== 'loading' && projectionState !== 'error' ? (
            <p className="text-sm text-gray-500">No evidence available.</p>
          ) : null}

          {evidence.map((item, index) => {
            if (item.kind === 'link') {
              return (
                <a
                  key={index}
                  href={item.href}
                  target="_blank"
                  rel={item.rel}
                  className="text-blue-600 underline text-sm sm:text-base break-all block py-1"
                  aria-label={`Evidence link: ${item.text} (opens in new tab)`}
                >
                  {item.text}
                </a>
              );
            }

            if (item.kind === 'image') {
              return (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={index}
                  src={item.src}
                  alt={`Evidence ${index + 1}`}
                  className="rounded-lg max-h-40 sm:max-h-60 w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              );
            }

            if (item.kind === 'text') {
              return (
                <p key={index} className="text-sm sm:text-base leading-relaxed">
                  {item.text}
                </p>
              );
            }

            return (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-gray-500 italic py-1"
                role="note"
                data-testid="evidence-blocked-item"
              >
                <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{item.reason}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ProjectedEvidenceViewer({ claimId }: { claimId: string }) {
  const projection = useClaimDetailProjection({ claimId });
  const evidence = sanitizeEvidenceList(projection.data?.claim.evidence ?? []);
  const state: ProjectionState =
    projection.viewState === 'loading' ||
    projection.viewState === 'error' ||
    projection.viewState === 'ready-stale'
      ? projection.viewState
      : 'ready';

  return (
    <EvidenceViewerContent
      evidence={evidence}
      projectionState={state}
      onRetry={projection.refetch}
    />
  );
}

/**
 * Fail-closed evidence boundary. Caller-supplied evidence is rendered without
 * activating a query; absent evidence is loaded from the canonical projection.
 */
export function EvidenceViewer({ claimId, evidence }: EvidenceViewerProps) {
  if (evidence !== undefined) {
    return <EvidenceViewerContent evidence={sanitizeEvidenceList(evidence)} />;
  }
  return <ProjectedEvidenceViewer claimId={claimId} />;
}

export default EvidenceViewer;
