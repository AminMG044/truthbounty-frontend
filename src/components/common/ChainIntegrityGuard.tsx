'use client';

/**
 * ChainIntegrityGuard — Context-aware wrapper that evaluates chain + API
 * integrity and feeds FallbackBoundary.
 * V2-FE-136
 *
 * Reads the current wagmi chain, checks it against supported chains,
 * integrates RPC fallback state, and renders children inside FallbackBoundary.
 *
 * Usage:
 *   <ChainIntegrityGuard>
 *     <ClaimSubmissionForm />
 *   </ChainIntegrityGuard>
 */

import type { ReactNode } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { isSupportedChain } from '@/config/chains';
import { useRpcFallback } from '@/hooks/useRpcFallback';
import { FallbackBoundary } from './FallbackBoundary';
import type { IntegrityStatus } from '@/lib/rpc-fallback/types';
import { useReleaseContext } from '@/hooks/useReleaseContext';
import { useIdentityTrust } from '@/hooks/useIdentityTrust';
import { useProtectedStateInvalidation } from '@/hooks/useProtectedStateInvalidation';

export interface ChainIntegrityGuardProps {
  children: ReactNode;
  /** Override the wagmi chainId (useful for testing). */
  chainIdOverride?: number;
  /** Pass through to FallbackBoundary. */
  fallback?: ReactNode;
  blockActions?: boolean;
  /**
   * Whether the current view is offline. When true, mutation and
   * authorization flows must fail closed and canonical reconciliation is
   * required. Offline content is never presented as fresh or final.
   */
  offline?: boolean;
  /**
   * The release the cached/projected data was produced under. When it
   * differs from the currently active release, the guard fails closed.
   */
  cacheRelease?: string | null;
  /** The currently active release identifier. */
  activeRelease?: string | null;
  /**
   * The chain the cached data was observed on. When it differs from the
   * current chain, the guard fails closed.
   */
  cacheChainId?: number | null;
  /**
   * Timestamp (ms) at which the cached projection was observed. Used to
   * mark offline/stale content with an observation time.
   */
  observedAt?: number | null;
  /**
   * Whether the cached data was observed as finalized. Offline content
   * that was not finalized must not be presented as final.
   */
  cacheFinalized?: boolean;
  /** Override the canonical reconciliation state (useful for testing). */
  reconciledOverride?: boolean;
  /** Override the connected account address (useful for testing). */
  accountOverride?: `0x${string}` | undefined;
  /** Override the pinned release identifier (useful for testing). */
  releaseOverride?: string | null;
  /** Override the identity/trust status (useful for testing). */
  identityStatusOverride?: 'verified' | 'stale' | 'revoked' | 'unavailable';
}

export function ChainIntegrityGuard({
  children,
  chainIdOverride,
  fallback,
  blockActions = true,
  offline = false,
  cacheRelease = null,
  activeRelease = null,
  cacheChainId = null,
  observedAt = null,
  cacheFinalized = false,
  reconciledOverride,
  accountOverride,
  releaseOverride,
  identityStatusOverride,
}: ChainIntegrityGuardProps) {
  const wagmiChainId = useChainId();
  const chainId = chainIdOverride ?? wagmiChainId;
  const { address: wagmiAddress } = useAccount();
  const address = accountOverride ?? wagmiAddress;

  const { state: rpcState, allUnhealthy, isDegraded } = useRpcFallback(chainId, {
    disableProbing: false,
  });

  const release = useReleaseContext(releaseOverride);
  const identity = useIdentityTrust(address, identityStatusOverride);

  // Account/chain/release changes invalidate protected UI state.
  useProtectedStateInvalidation({ chainId, address, releaseId: release.releaseId });

  const supported = isSupportedChain(chainId);

  // Canonical reconciliation is required whenever the view is offline,
  // degraded, or otherwise not confirmed against the canonical source.
  const reconciled =
    reconciledOverride ??
    (!offline && !allUnhealthy && !isDegraded && !rpcState?.isUsingFallback);

  // Wallet/account/release/chain changes must clear or isolate affected
  // cache. When the cache was observed under a different release or chain,
  // the guard fails closed rather than presenting stale data as fresh.
  const releaseMismatch =
    cacheRelease != null &&
    activeRelease != null &&
    cacheRelease !== activeRelease;
  const chainMismatch = cacheChainId != null && cacheChainId !== chainId;

  let integrityStatus: IntegrityStatus = 'valid';
  let statusReason: string | null = null;

  if (!address) {
    integrityStatus = 'blocked';
    statusReason = 'Wallet not connected. Connect a wallet to view protocol context.';
  } else if (!supported) {
    integrityStatus = 'blocked';
    statusReason = `Chain ${chainId} is not supported. Please switch to Optimism or Optimism Sepolia.`;
  } else if (releaseMismatch) {
    integrityStatus = 'blocked';
    statusReason =
      'Cached content was observed under a different release. Refresh to reconcile with the current release.';
  } else if (chainMismatch) {
    integrityStatus = 'blocked';
    statusReason =
      'Cached content was observed on a different chain. Reconnect to reconcile with the current chain.';
  } else if (!observedAt) {
    integrityStatus = 'blocked';
    statusReason =
      'Cached content is missing an observation time and cannot be trusted. Refresh to reconcile.';
  } else if (release.status === 'changed' || release.status === 'unavailable') {
    integrityStatus = 'blocked';
    statusReason =
      release.status === 'changed'
        ? 'Pinned release changed. Protected UI state was invalidated; re-verify before continuing.'
        : 'Pinned release manifest is unavailable. Protocol actions are disabled.';
  } else if (identity.status === 'revoked') {
    integrityStatus = 'blocked';
    statusReason = 'Identity attestation is revoked. Protocol actions are disabled.';
  } else if (allUnhealthy) {
    integrityStatus = 'error';
    statusReason =
      'All RPC providers are unreachable. Protocol actions are disabled until connectivity is restored.';
  } else if (rpcState?.circuitOpen) {
    integrityStatus = 'blocked';
    statusReason = 'RPC circuit breaker is open. Please wait before retrying.';
  } else if (offline) {
    integrityStatus = 'degraded';
    statusReason = cacheFinalized
      ? 'Offline. Showing previously viewed data observed at the recorded time. Mutations are disabled until reconnected.'
      : 'Offline. Showing previously viewed unfinalized data. Mutations are disabled until reconnected.';
  } else if (isDegraded || rpcState?.isUsingFallback) {
    integrityStatus = 'degraded';
    statusReason = rpcState?.isUsingFallback
      ? 'Primary RPC provider is unreachable. A fallback provider is in use; data may be slightly delayed.'
      : 'RPC provider is experiencing degraded performance. Data may be slightly delayed.';
  } else if (identity.status === 'stale') {
    integrityStatus = 'degraded';
    statusReason = 'Identity attestation is stale. Trust is non-authoritative; re-verify before continuing.';
  } else if (identity.status === 'unavailable') {
    integrityStatus = 'degraded';
    statusReason = 'Identity attestation is unavailable. Trust is non-authoritative.';
  }

  // Offline and non-reconciled states must always block mutation and
  // authorization flows. Never present offline content as fresh or final.
  const effectiveBlockActions =
    blockActions || offline || !reconciled || releaseMismatch || chainMismatch;

  return (
    <FallbackBoundary
      status={integrityStatus}
      reason={statusReason}
      fallback={fallback}
      blockActions={effectiveBlockActions}
    >
      {children}
    </FallbackBoundary>
  );
}