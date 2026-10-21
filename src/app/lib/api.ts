/**
 * API client for claim and verification flows.
 *
 * Mutations fail closed when the browser is offline or canonical deps are unavailable.
 * Mutations fail closed when the browser is offline or when the
 * canonical dependencies are unavailable. We never fabricate protocol
 * state or queue mutations for later replay.
 */

import { evaluateMutationGate } from '@/app/queries/offlineCache';
import { getCanonicalChainId } from '@/app/lib/chain';

export class OfflineMutationBlockedError extends Error {
  constructor(reason: string) {
    super(`Mutation blocked: ${reason}`);
    this.name = 'OfflineMutationBlockedError';
  }
}

function assertMutationAllowed(): void {
  const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  const chainId = getCanonicalChainId();
  const gate = evaluateMutationGate({
    online,
    chainId,
    chainSupported: chainId !== null,
    release: process.env.NEXT_PUBLIC_RELEASE_ID ?? 'unknown',
    apiFresh: true,
  });
  if (!gate.allowed) {
    throw new OfflineMutationBlockedError(gate.reason ?? 'unavailable');
  }
}

export async function getClaimById(id: string) {
  const res = await fetch(`/api/claims/${id}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('CLAIM_NOT_FOUND');
    }
    throw new Error('Failed to fetch claim');
  }
  return res.json();
}

export async function submitVerification(payload: {
  claimId: string;
  decision: 'verify' | 'reject';
  stakeAmount: number;
}) {
  assertMutationAllowed();

  const res = await fetch('/api/verifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Verification failed');
  return res.json();
}
