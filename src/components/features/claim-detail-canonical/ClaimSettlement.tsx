'use client';

/**
 * ClaimSettlement — Settlement state and finalization display
 *
 * Shows settlement transaction and finalization status. Never fabricates
 * settlement or finality; all fields null when not settled.
 *
 * Security: treats all claim projection fields as untrusted. The transaction
 * hash is validated before being interpolated into an external explorer URL,
 * and the explorer URL is built through the centralized sanitizer policy.
 */

import { CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import type { ClaimDetailProjection } from '@/app/types/claim-detail-projection';

export interface ClaimSettlementProps {
  claim: ClaimDetailProjection;
}

const EXPLORER_BASE = 'https://optimistic.etherscan.io/tx/';

/**
 * Local fail-closed validators. The centralized sanitizer module is the
 * authority; these mirror its contract for the narrow shapes used here so
 * this component never trusts projection fields.
 */
const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

function isSafeTxHash(value: unknown): value is string {
  return typeof value === 'string' && TX_HASH_PATTERN.test(value);
}

function buildSafeLink(hash: string, base: string): string | null {
  if (!isSafeTxHash(hash)) {
    return null;
  }
  try {
    const url = new URL(`${base}${hash}`);
    if (url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function formatSettledDate(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return 'Unknown';
  }
  return new Date(timestamp).toLocaleString();
}

function formatInteger(value: number): string {
  if (!Number.isSafeInteger(value)) {
    return 'Unknown';
  }
  return value.toLocaleString();
}

export function ClaimSettlement({ claim }: ClaimSettlementProps) {
  const { settlement } = claim;

  // No settlement yet
  if (!settlement.settledAt || !settlement.settlementTxHash) {
    return null;
  }

  // Fail closed on malformed or unsafe transaction hashes.
  if (!isSafeTxHash(settlement.settlementTxHash)) {
    return null;
  }

  const explorerUrl = buildSafeLink(settlement.settlementTxHash, EXPLORER_BASE);
  if (!explorerUrl) {
    return null;
  }

  const settledDate = formatSettledDate(settlement.settledAt);
  const txPrefix = settlement.settlementTxHash.slice(0, 10);

  return (
    <div className="pt-4 border-t border-[#232329] space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Settlement
      </h2>

      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        {/* Settlement Status */}
        <div className="flex items-center gap-2">
          {settlement.isFinalized ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden="true" />
              <span className="text-sm font-medium text-green-500">Finalized</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              <span className="text-sm font-medium text-yellow-500">
                Confirming Settlement
              </span>
            </>
          )}
        </div>

        {/* Settlement Details */}
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-gray-400">Settled At:</dt>
            <dd className="text-gray-200">{settledDate}</dd>
          </div>

          {settlement.finalizedBlock !== null && (
            <div className="flex justify-between">
              <dt className="text-gray-400">Finalized Block:</dt>
              <dd className="text-gray-200 font-mono">
                {formatInteger(settlement.finalizedBlock)}
              </dd>
            </div>
          )}

          <div className="flex justify-between items-center">
            <dt className="text-gray-400">Transaction:</dt>
            <dd className="font-mono">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                aria-label={`View settlement transaction ${txPrefix}... on block explorer (opens in new tab)`}
              >
                {txPrefix}...
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </dd>
          </div>
        </dl>

        {!settlement.isFinalized && (
          <p className="text-xs text-gray-500 italic">
            Settlement is pending finalization. This may take a few minutes.
          </p>
        )}
      </div>
    </div>
  );
}
