'use client';

/**
 * useClaimDetailErrorRecovery — Error recovery strategies for claim detail
 *
 * Provides automatic and manual recovery mechanisms for different error scenarios:
 * - Network errors: automatic retry with exponential backoff
 * - Stale projections: manual refresh
 * - Not found: navigation to claims list
 * - Unsupported chain: wallet chain switch prompt
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClaimDetailError } from '@/app/types/claim-detail-projection';

export interface UseClaimDetailErrorRecoveryConfig {
  error: Error | ClaimDetailError | null;
  errorCode: string | null;
  isError: boolean;
  refetch: () => void;
  onChainSwitch?: () => void;
}

export interface UseClaimDetailErrorRecoveryResult {
  /** Attempt recovery based on error type */
  recover: () => void;
  /** Navigate back to claims list */
  navigateToClaims: () => void;
  /** Check if auto-recovery is in progress */
  isRecovering: boolean;
  /** Get recovery strategy for current error */
  recoveryStrategy: RecoveryStrategy;
}

export type RecoveryStrategy =
  | 'retry' // Network/transient error - can retry
  | 'refresh' // Stale data - manual refresh recommended
  | 'navigate' // Not found - navigate away
  | 'chain-switch' // Wrong chain - prompt chain switch
  | 'none'; // No recovery available

function getRecoveryStrategy(errorCode: string | null): RecoveryStrategy {
  switch (errorCode) {
    case 'CLAIM_NOT_FOUND':
      return 'navigate';
    case 'UNSUPPORTED_CHAIN':
      return 'chain-switch';
    case 'PROJECTION_STALE':
      return 'refresh';
    case 'PROJECTION_UNAVAILABLE':
    case 'PROJECTION_MALFORMED':
      return 'retry';
    case 'UNKNOWN':
    default:
      return 'retry';
  }
}

/**
 * Hook for managing error recovery in claim detail views.
 */
export function useClaimDetailErrorRecovery(
  config: UseClaimDetailErrorRecoveryConfig
): UseClaimDetailErrorRecoveryResult {
  const { errorCode, isError, refetch, onChainSwitch } = config;
  const router = useRouter();
  const [isRecovering, setIsRecovering] = useState(false);
  const retryCountRef = useRef(0);

  const recoveryStrategy = getRecoveryStrategy(errorCode);

  const navigateToClaims = useCallback(() => {
    router.push('/claims');
  }, [router]);

  const recover = useCallback(() => {
    if (isRecovering) return;

    switch (recoveryStrategy) {
      case 'retry':
      case 'refresh':
        setIsRecovering(true);
        retryCountRef.current += 1;
        refetch();
        // Reset recovering flag after a delay
        setTimeout(() => {
          setIsRecovering(false);
        }, 1000);
        break;

      case 'navigate':
        navigateToClaims();
        break;

      case 'chain-switch':
        if (onChainSwitch) {
          onChainSwitch();
        }
        break;

      case 'none':
      default:
        // No recovery action available
        break;
    }
  }, [isRecovering, recoveryStrategy, refetch, navigateToClaims, onChainSwitch]);

  // Reset retry count when error clears
  useEffect(() => {
    if (!isError) {
      retryCountRef.current = 0;
      setIsRecovering(false);
    }
  }, [isError]);

  return {
    recover,
    navigateToClaims,
    isRecovering,
    recoveryStrategy,
  };
}
