'use client';

/**
 * ClaimSettlement — Settlement state and finalization display
 *
 * Shows settlement transaction and finalization status. Never fabricates
 * settlement or finality; all fields null when not settled.
 *
 * The canonical transaction-state authority distinguishes review, simulation,
 * signature, submission, confirmation, finality, and indexing. This component
 * renders only the settlement-specific states and never collapses them into a
 * single success indicator.
 */

import { AlertTriangle, CheckCircle2, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import type { ClaimDetailProjection } from '@/app/types/claim-detail-projection';
import { resolveFinalityState } from '@/app/lib/protocol-time';
import { formatLocalDateTime, formatUtcDateTime } from '@/app/lib/format';

export interface ClaimSettlementProps {
  claim: ClaimDetailProjection;
}

type SettlementState =
  | 'confirming'
  | 'finalized'
  | 'rejected'
  | 'replaced'
  | 'reverted'
  | 'reorged'
  | 'projection-lag';

function resolveSettlementState(
  claim: ClaimDetailProjection,
): SettlementState {
  const { settlement } = claim;

  if (settlement.isReorged) {
    return 'reorged';
  }

  if (settlement.isProjectionLag) {
    return 'projection-lag';
  }

  if (settlement.isReverted) {
    return 'reverted';
  }

  if (settlement.isReplaced) {
    return 'replaced';
  }

  if (settlement.isRejected) {
    return 'rejected';
  }

  if (settlement.isFinalized) {
    return 'finalized';
  }

  return 'confirming';
}

const STATE_PRESENTATION: Record<
  SettlementState,
  {
    label: string;
    description: string;
    icon: typeof CheckCircle2;
    iconClass: string;
    textClass: string;
    role: 'status' | 'alert';
  }
> = {
  confirming: {
    label: 'Confirming Settlement',
    description:
      'Submitted to Optimism. Awaiting confirmation and finality.',
    icon: Clock,
    iconClass: 'text-yellow-500',
    textClass: 'text-yellow-500',
    role: 'status',
  },
  finalized: {
    label: 'Finalized',
    description:
      'Settlement is finalized on Optimism and reflected in canonical contract state.',
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    textClass: 'text-green-500',
    role: 'status',
  },
  rejected: {
    label: 'Settlement Rejected',
    description:
      'The settlement transaction was rejected by the wallet or node. No settlement occurred.',
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    textClass: 'text-red-500',
    role: 'alert',
  },
  replaced: {
    label: 'Settlement Replaced',
    description:
      'The settlement transaction was replaced by another transaction. Review the replacement reference.',
    icon: RefreshCw,
    iconClass: 'text-orange-500',
    textClass: 'text-orange-500',
    role: 'alert',
  },
  reverted: {
    label: 'Settlement Reverted',
    description:
      'The settlement transaction reverted on-chain. No settlement occurred.',
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    textClass: 'text-red-500',
    role: 'alert',
  },
  reorged: {
    label: 'Settlement Reorged',
    description:
      'The settlement transaction was reorged out of the canonical chain. Waiting for confirmation on the canonical chain.',
    icon: AlertTriangle,
    iconClass: 'text-orange-500',
    textClass: 'text-orange-500',
    role: 'alert',
  },
  'projection-lag': {
    label: 'Projection Lag',
    description:
      'The API projection has not yet caught up to canonical contract state. Refresh to reconcile.',
    icon: RefreshCw,
    iconClass: 'text-sky-500',
    textClass: 'text-sky-500',
    role: 'status',
  },
};

function ExplorerLink(
  { hash, label }: { hash: string; label: string }
) {
  const url = `https://optimistic.etherscan.io/tx/${hash}`;
  const shortHash = `${hash.slice(0, 10)}…`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 font-mono focus-outline focus:outline-2 focus-outline-offset-2 focus-outline-blue-400 rounded-sm"
      aria-label={`View ${label} ${shortHash} on Optimism Etherscan (opens in new tab)`}
    >
      {shortHash}
      <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}

export function ClaimSettlement({ claim }: ClaimSettlementProps) {
  const { settlement } = claim;

  // No settlement reference at all — nothing to render.
  if (!settlement.settledAt || !settlement.settlementTxHash) {
    return null;
  }

  const state = resolveSettlementState(claim);
  const presentation = STATE_PRESENTATION[state];
  const Icon = presentation.icon;
  const settledMs = new Date(settlement.settledAt).getTime();
  const localSettled = formatLocalDateTime(settledMs, { includeSeconds: true });
  const utcSettled = formatUtcDateTime(settledMs, { includeSeconds: true });

  const finalityState = resolveFinalityState({
    isFinalized: settlement.isFinalized,
    isConfirmed: true,
  });

  const txPrefix = settlement.settlementTxHash.slice(0, 10);

  return (
    <div className="pt-4 border-t border-[#232329] space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Settlement
      </h2>

      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2" role={presentation.role}>
          <Icon className={`h-5 w-5 ${presentation.iconClass}`} aria-hidden="true" />
          <span className={`text-sm font-medium ${presentation.textClass}`}>
            {presentation.label}
          </span>
        </div>

        <p className="text-xs text-gray-400">{presentation.description}</p>

        <dl className="space-y-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-gray-400">Chain:</dt>
            <dd className="text-gray-200">Optimism</dd>
          </div>

          <div className="flex justify-between gap-2">
            <dt className="text-gray-400">Settled At:</dt>
            <dd className="text-gray-200 text-right">
              {localSettled} <span className="text-gray-500">({utcSettled})</span>
            </dd>
          </div>

          {settlement.finalizedBlock !== null && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Finalized Block:</dt>
              <dd className="text-gray-200 font-mono">
                {settlement.finalizedBlock.toLocaleString()}
              </dd>
            </div>
          )}

          {settlement.replacementTxHash && (
            <div className="flex justify-between items-center">
              <dt className="text-gray-400">Replacement:</dt>
              <dd>
                <ExplorerLink
                  hash={settlement.replacementTxHash}
                  label="replacement transaction"
                />
              </dd>
            </div>
          )}

          <div className="flex justify-between items-center">
            <dt className="text-gray-400">Transaction:</dt>
            <dd>
              <ExplorerLink
                hash={settlement.settlementTxHash}
                label="settlement transaction"
              />
            </dd>
          </div>
        </dl>

        {state === 'confirming' && (
          <p className="text-xs text-gray-500 italic">
            Settlement is confirmed but not yet finalized. This may take a few minutes.
          </p>
        )}

        {finalityState === 'unavailable' && (
          <p className="text-xs text-gray-500 italic">
            Finality status is unavailable. Refresh once canonical data is available.
          </p>
        )}
      </div>
    </div>
  );
}