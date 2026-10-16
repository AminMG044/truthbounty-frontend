// src/app/queries/freshness.queries.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApiHealth } from '../api/freshness.api';
import type { ApiHealthResponse, UseApiFreshnessResult, UseApiFreshnessConfig } from '@/app/types/api-freshness';

/**
 * Query key for API freshness data
 */
export const freshnessQueryKey = ['api', 'freshness'] as const;

/**
 * Marker attached to any cached projection data that may be served offline/stale.
 * This is the single source of truth for whether a consumer may treat data as fresh.
 */
export interface FreshnessObservation {
  /** Wall-clock time the observation was captured (epoch ms). */
  observedAt: number;
  /** Chain id the observation was taken against. */
  chainId: string | null;
  /** Release identifier the observation belongs to. */
  release: string | null;
  /** Whether the observed state was finalized at capture time. */
  finalized: boolean;
  /** Whether the observation was served from cache rather than canonical source. */
  fromCache: boolean;
  /** Whether the observation is considered stale at read time. */
  stale: boolean;
  /** Reason the observation is not fresh, else null. */
  reason: FreshnessStaleReason | null;
}

export type FreshnessStaleReason =
  | 'offline'
  | 'stale'
  | 'wrong-chain'
  | 'wrong-release'
  | 'not-finalized'
  | 'degraded'
  | 'cache-corrupt'
  | 'unauthorized';

/**
 * Minimum cache context that any cached projection must carry so that
 * consumers can fail closed when authority cannot be established.
 */
export interface CacheContext {
  chainId: string | null;
  release: string | null;
  accountId: string | null;
}

/**
 * Resolve the current cache context from the runtime environment.
 * This is deliberately conservative: any unknown value fails closed.
 */
export function resolveCacheContext(): CacheContext {
  if (typeof window === 'undefined') {
    return { chainId: null, release: null, accountId: null };
  }
  const win = window as typeof window & {
    __TRUTGBOUNTY_CHAIN_ID__?: unknown;
    __TRUTGBOUNTY_RELEASE__?: unknown;
    __TRUTGBOUNTY_ACCOUNT_ID__?: unknown;
  };
  const chainId = typeof win.__TRUTGBOUNTY_CHAIN_ID__ === 'string' ? win.__TRUTGBOUNTY_CHAIN_ID__ : null;
  const release = typeof win.__TRUTGBOUNY_RELEASE__ === 'string' ? win.__TRUTGBOUNY_RELEASE__ : null;
  const accountId = typeof win.__TRUTGBOUNTY_ACCOUNT_ID__ === 'string' ? win.__TRUTGBOUNY_ACCOUNT_ID__ : null;
  return { chainId, release, accountId };
}

/**
 * Build a freshness observation from an API health response and the current
 * cache context. This never fabricates protocol state: if the response is missing
 * or inconsistent, the observation is marked stale with an explicit reason.
 */
export function buildFreshnessObservation(
  response: ApiHealthResponse | null | undefined,
  context: CacheContext,
  options: { maxAcceptableLag?: number; now?: number } = {},
): FreshnessObservation {
  const now = options.now ?? Date.now();
  const maxAcceptableLag = options.maxAcceptableLag ?? 100;

  if (!response) {
    return {
      observedAt: now,
      chainId: context.chainId,
      release: context.release,
      finalized: false,
      fromCache: true,
      stale: true,
      reason: 'offline',
    };
  }

  const freshness = response.freshness;
  if (!freshness || typeof freshness.lag !== 'number') {
    return {
      observedAt: now,
      chainId: context.chainId,
      release: context.release,
      finalized: false,
      fromCache: true,
      stale: true,
      reason: 'cache-corrupt',
    };
  }

  const responseChainId = typeof response.chainId === 'string' ? response.chainId : null;
  const responseRelease = typeof response.release === 'string' ? response.release : null;

  if (context.chainId !== null && responseChainId !== null && context.chainId !== responseChainId) {
    return {
      observedAt: now,
      chainId: responseChainId,
      release: responseRelease,
      finalized: false,
      fromCache: true,
      stale: true,
      reason: 'wrong-chain',
    };
  }

  if (context.release !== null && responseRelease !== null && context.release !== responseRelease) {
    return {
      observedAt: now,
      chainId: responseChainId,
      release: responseRelease,
      finalized: false,
      fromCache: true,
      stale: true,
      reason: 'wrong-release',
    };
  }

  if (freshness.lag > maxAcceptableLag) {
    return {
      observedAt: now,
      chainId: responseChainId,
      release: responseRelease,
      finalized: freshness.lag === 0,
      fromCache: false,
      stale: true,
      reason: 'stale',
    };
  }

  if (response.degradedState?.isDegraded) {
    return {
      observedAt: now,
      chainId: responseChainId,
      release: responseRelease,
      finalized: false,
      fromCache: false,
      stale: true,
      reason: 'degraded',
    };
  }

  return {
    observedAt: now,
    chainId: responseChainId,
    release: responseRelease,
    finalized: true,
    fromCache: false,
    stale: false,
    reason: null,
  };
}

/**
 * Whether a freshness observation may be treated as fresh and final.
 */
export function isObservationFresh(observation: FreshnessObservation | null | undefined): boolean {
  if (!observation) return false;
  return !observation.stale && !observation.fromCache && observation.finalized;
}

/**
 * Whether mutation and authorization flows may proceed given the current
 * freshness observation. Mutations fail closed whenever canonical dependencies
 * are unavailable or not final.
 */
export function canMutate(observation: FreshnessObservation | null | undefined): boolean {
  return isObservationFresh(observation);
}

/**
 * Hook for fetching API freshness and degraded-state metadata
 *
 * Exposes indexed height, finalized height, last update, lag, and dependency degradation
 * without claiming on-chain failure. Offline/stale content is always marked with
 * observation time, chain, release, and finality.
 *
 * @param config - Configuration options for polling and thresholds
 * @returns Freshness data with loading, error, and refetch states
 */
export function useApiFreshness(config: UseApiFreshnessConfig = {}): UseApiFreshnessResult {
  const {
    pollInterval = 30_000, // 30 seconds default
    maxAcceptableLag = 100,
  } = config;

  const queryClient = useQueryClient();
  const context = resolveCacheContext();

  const query = useQuery<ApiHealthResponse, Error>({
    queryKey: [...freshnessQueryKey, context.chainId, context.release, context.accountId],
    queryFn: fetchApiHealth,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
    staleTime: 10_000, // Consider data stale after 10 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    networkMode: 'offlineFirst',
  });

  const observation = buildFreshnessObservation(query.data ?? null, context, {
    maxAcceptableLag,
  });

  const isDegraded = query.data?.degradedState.isDegraded ?? false;
  const isFresh = isObservationFresh(observation);

  const reconcile = () => {
    // Reconnect forces canonical reconciliation: drop any cached projection
    // data and re-fetch from the authoritative source.
    queryClient.removeQueries({ queryKey: freshnessQueryKey });
    return query.refetch().then(() => undefined);
  };

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => query.refetch().then(() => undefined),
    isFresh,
    isDegraded,
    observation,
    canMutate: canMutate(observation),
    reconcile,
  };
}

/**
 * Hook for fetching just the freshness data (without degraded state)
 * Useful for lightweight consumers
 */
export function useFreshnessData() {
  const context = resolveCacheContext();
  const query = useQuery<ApiHealthResponse['freshness'], Error>({
    queryKey: [...freshnessQueryKey, 'data', context.chainId, context.release, context.accountId],
    queryFn: async () => {
      const response = await fetchApiHealth();
      return response.freshness;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
    networkMode: 'offlineFirst',
  });

  return {
    freshness: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => query.refetch().then(() => undefined),
  };
}

/**
 * Hook for fetching just the degraded state
 * Useful for components that only need degradation status
 */
export function useDegradedState() {
  const context = resolveCacheContext();
  const query = useQuery<ApiHealthResponse['degradedState'], Error>({
    queryKey: [...freshnessQueryKey, 'degraded', context.chainId, context.release, context.accountId],
    queryFn: async () => {
      const response = await fetchApiHealth();
      return response.degradedState;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
    networkMode: 'offlineFirst',
  });

  return {
    degradedState: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => query.refetch().then(() => undefined),
    isDegraded: query.data?.isDegraded ?? false,
  };
}

/**
 * Hook for fetching dependency health only
 */
export function useDependencyHealth() {
  const context = resolveCacheContext();
  const query = useQuery<ApiHealthResponse['freshness']['dependencies'], Error>({
    queryKey: [...freshnessQueryKey, 'dependencies', context.chainId, context.release, context.accountId],
    queryFn: async () => {
      const response = await fetchApiHealth();
      return response.freshness.dependencies;
    },
    refetchInterval: 60_000, // Dependencies change less frequently
    refetchIntervalInBackground: true,
    staleTime: 30_000,
    networkMode: 'offlineFirst',
  });

  return {
    dependencies: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => query.refetch().then(() => undefined),
  };
}

/**
 * Clear or isolate affected cache entries when the wallet, account, chain, or
 * release changes. This ensures cross-account cache isolation and prevents
 * stale or wrong-context data from being served as fresh.
 */
export function clearFreshnessCache(queryClient: { removeQueries: (args: { queryKey: readonly unknown[] }) => void }): void {
  queryClient.removeQueries({ queryKey: freshnessQueryKey });
}
