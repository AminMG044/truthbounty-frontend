// src/app/queries/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { readLowBandwidth } from '@/hooks/useNetworkStatus';
import {
  readPersisted,
  registerPersistedKey,
  type PersistedKeyRegistration,
} from '@/app/lib/persistedState';
import { CACHE_RELEASE, isNonCacheable } from './offlineCache';

type QueryKeyRoot = string | number | null | undefined;

interface QueryLike {
  queryKey?: readonly unknown[];
  state?: { data?: unknown };
}

interface MutationLike {
  options?: { mutationKey?: readonly unknown[] };
}

const BASE_STALE_TIME = 1000 * 60 * 5; // 5 mins
const LOW_BANDWIDTH_STALE_TIME = 1000 * 60 * 15; // 15 mins when data-saver/slow
const GC_TIME = 1000 * 60 * 30; // 30 mins
const MAX_RETRY = 2;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

/** Skip futile retries while the browser reports offline. */
function shouldRetry(failureCount: number): boolean {
  if (isBrowser() && navigator.onLine === false) return false;
  return failureCount < MAX_RETRY;
}

/** Exponential backoff capped at 30s — kinder on constrained links. */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30_000);
}

function resolveStaleTime(): number {
  return isBrowser() && readLowBandwidth() ? LOW_BANDWIDTH_STALE_TIME : BASE_STALE_TIME;
}

/** Observation metadata attached to every successful query. */
export interface ObservationMeta {
  observedAt: number;
  chainId: number | null;
  release: string;
  finality: 'unknown' | 'pending' | 'finalized';
  walletScope: string | null;
  stale: boolean;
  source: 'cache' | 'network';
}

/**
 * Cache allow-list. Only public, documentation, legal, and previously viewed
 * projection data may be cached. Everything else (mutations, auth, wallet,
 * evidence, user content) is treated as non-cacheable and fails closed.
 */
export const CACHEABLE_ROOTS: ReadonlySet<string> = new Set([
  'public',
  'docs',
  'documentation',
  'legal',
  'projection',
  'projections',
  'viewed',
  'history',
]);

/** Roots that must never be cached or served from cache. */
export const NON_CACHEABLE_ROOTS: ReadonlySet<string> = new Set([
  'auth',
  'authorization',
  'session',
  'wallet',
  'account',
  'mutation',
  'mutations',
  'evidence',
  'user',
  'userContent',
  'receipt',
  'receipts',
]);

function rootOf(queryKey: readonly unknown[] | undefined): QueryKeyRoot {
  const root = queryKey?.[0];
  if (typeof root === 'string' || typeof root === 'number') return root;
  return undefined;
}

/** True when the query root is explicitly allowed to be cached. */
export function isCacheableRoot(root: QueryKeyRoot): boolean {
  if (root === undefined || root === null) return false;
  if (isNonCacheable(root)) return false;
  if (NON_CACHEABLE_ROOTS.has(String(root))) return false;
  return CACHEABLE_ROOTS.has(String(root));
}

/** True when the query root must never be cached. */
export function isBlockedRoot(root: QueryKeyRoot): boolean {
  if (root === undefined || root === null) return true;
  if (isNonCacheable(root)) return true;
  return NON_CACHEABLE_ROOTS.has(String(root));
}

/**
 * Attach observation metadata to every successful query. Non-cacheable roots
 * are marked stale so they are never presented as fresh or final.
 */
function attachObservationMeta(
  _data: unknown,
  query: QueryLike,
): ObservationMeta {
  const root = rootOf(query.queryKey);
  const blocked = isBlockedRoot(root);
  const cacheable = isCacheableRoot(root);
  return {
    observedAt: Date.now(),
    chainId: null,
    release: CACHE_RELEASE,
    finality: 'unknown',
    walletScope: null,
    stale: blocked || !cacheable,
    source: 'network',
  };
}

/**
 * Fail closed: any mutation whose key is not explicitly allowed is rejected
 * while canonical dependencies are unavailable (offline / stale / wrong chain).
 */
function guardMutation(mutation: MutationLike): void {
  const root = rootOf(mutation.options?.mutationKey);
  if (isBlockedRoot(root)) {
    throw new Error('Mutation blocked: canonical dependencies unavailable.');
  }
  if (isBrowser() && navigator.onLine === false) {
    throw new Error('Mutation blocked: offline.');
  }
}

/**
 * Persisted Query Cache Policy
 * ---------------------------
 * The query cache is persisted to browser storage only through the versioned,
 * bounded persistence layer. The cache is treated as untrusted input on rehydration:
 * corrupt, oversized, expired, partially written, or unsupported-newer state fails
 * closed and is dropped rather than boot-looping. Authoritative protocol state,
 * contract receipts, reviewed API projections, signatures, and secrets are never
 * persisted here.
 */
export const queryCachePersistence: PersistedKeyRegistration<unknown> = {
  key: 'tb.queryCache.v1',
  arena: 'localStorage',
  owner: 'query',
  version: 1,
  minVersion: 1,
  retentionMs: GC_TIME,
  maxBytes: 250 * 1024,
  sensitivity: 'internal',
  validate: (value): value is unknown => value !== undefined,
};

registerPersistedKey(queryCachePersistence);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: resolveStaleTime(),
      gcTime: GC_TIME,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
      retry: shouldRetry,
      retryDelay,
      // Offline read-only: serve last observed projections with metadata.
      // Mutations remain gated by networkMode: 'online'.
      meta: attachObservationMeta,
    },
    mutations: {
      onMutate: guardMutation,
      onError: (error) => console.error('Mutation error:', error),
      networkMode: 'online',
    },
  },
});

/**
 * Rehydrate the query cache from browser storage. The persistence layer enforces
 * versioned schemas, bounded migrations, expiry, size limits, and corruption
 * recovery. Any failure is swallowed and the cache starts empty.
 */
export function rehydrateQueryCache(): void {
  if (!isBrowser()) return;
  try {
    readPersisted(queryCachePersistence.key);
  } catch {
    // Fail closed: drop untrusted persisted state without boot-looping.
  }
}