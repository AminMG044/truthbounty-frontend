'use client';

/**
 * Compatibility facade for the reward projection and canonical claim flow.
 *
 * Keeps reads and writes separated internally while presenting the stable UI
 * contract consumed by the dashboard and reward panel.
 */

import { useCallback, useMemo } from 'react';
import { formatUnits } from 'viem';

import {
  REWARD_ALLOCATION_EXPLANATIONS,
  type RewardClaimReceiptProjection,
  type RewardEntitlement,
} from '@/app/types/rewards';
import { useRewardClaim } from '@/hooks/useRewardClaim';
import { useRewardEntitlements } from '@/hooks/useRewardEntitlements';

export type ClaimStatus = 'idle' | 'loading' | 'confirming' | 'success' | 'error';

export interface PendingReward extends RewardEntitlement {
  readonly amountRaw: string;
  readonly amountFormatted: string;
  readonly categoryExplanation: string;
}

export interface UseRewardsResult {
  readonly pendingRewards: readonly PendingReward[];
  readonly totalClaimableDisplay: string | null;
  readonly status: ClaimStatus;
  readonly lastTxHash: `0x${string}` | null;
  readonly receiptProjection: RewardClaimReceiptProjection | null;
  readonly errorMessage: string | null;
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly isUnsupported: boolean;
  readonly unsupportedReason: string | null;
  claimAll: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useRewards(): UseRewardsResult {
  const entitlements = useRewardEntitlements();
  const claim = useRewardClaim({
    onConfirmed: () => {
      void entitlements.refetch();
    },
  });

  const pendingRewards = useMemo<readonly PendingReward[]>(
    () =>
      entitlements.entitlements
        .filter((entry) => entry.claimable)
        .map((entry) => ({
          ...entry,
          amountRaw: entry.amount.toString(),
          amountFormatted: formatUnits(entry.amount, entry.decimals),
          categoryExplanation: REWARD_ALLOCATION_EXPLANATIONS[entry.category],
        })),
    [entitlements.entitlements],
  );

  const totalClaimableDisplay = useMemo(() => {
    const groups = entitlements.summary.claimableByAsset;
    if (groups.length === 0) return null;
    if (groups.length > 1) return `${groups.length} assets`;
    return formatUnits(groups[0].totalAmount, groups[0].decimals);
  }, [entitlements.summary.claimableByAsset]);

  const claimAll = useCallback(async () => {
    if (pendingRewards.length === 0) return;
    await claim.submitClaim(
      { claimIds: pendingRewards.map((entry) => entry.claimId) },
      pendingRewards,
    );
  }, [claim, pendingRewards]);

  const status: ClaimStatus = entitlements.isLoading
    ? 'loading'
    : claim.status === 'confirmed'
      ? 'success'
      : claim.status === 'reverted' ||
          claim.status === 'rejected' ||
          claim.status === 'error'
        ? 'error'
        : claim.status === 'preparing' ||
            claim.status === 'signature-requested' ||
            claim.status === 'submitted' ||
            claim.status === 'confirming'
          ? 'confirming'
          : 'idle';

  return {
    pendingRewards,
    totalClaimableDisplay,
    status,
    lastTxHash: claim.txHash,
    receiptProjection: claim.projection,
    errorMessage: claim.failure?.reason ?? null,
    isLoading: entitlements.isLoading,
    loadError: entitlements.error,
    isUnsupported: entitlements.isUnsupported || claim.isUnsupported,
    unsupportedReason:
      entitlements.unsupportedReason ?? claim.unsupportedReason,
    claimAll,
    refresh: entitlements.refetch,
    reset: claim.reset,
  };
}
