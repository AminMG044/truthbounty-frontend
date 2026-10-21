/**
 * Finality state types for TruthBounty V2
 *
 * Represents the four distinct finality levels recognised by Optimism/EVM:
 *
 *  observed  — tx was seen in the mempool or a pending block; not yet included
 *  safe      — tx is in a sequencer-confirmed L2 block (OP "safe" head)
 *  finalized — tx is in an L1-anchored, irreversible batch (OP "finalized" head)
 *  reorged   — a previously observed tx was invalidated by a chain reorganisation
 *
 * None of these levels may be fabricated from mock or local state alone;
 * the authoritative source is always the on-chain receipt and block tag.
 *
 * This module also defines the authorization boundary for the claim
 * submission flow: signature, submission, confirmation, finality, and
 * indexing are distinct states and must never be collapsed into a single
 * "success" signal.
 */

// ---------------------------------------------------------------------------
// Core finality discriminant
// ---------------------------------------------------------------------------

/** Ordered by increasing confirmation strength. */
export type FinalityLevel = 'observed' | 'safe' | 'finalized' | 'reorged';

/** Ordered by increasing authorization strength. */
export type AuthorizationLevel = 'unavailable' | 'review' | 'simulated' | 'signed' | 'submitted' | 'confirmed' | 'reverted' | 'reorged' | 'finalized' | 'indexed';

/**
 * Minimum on-chain data needed to derive a finality level for a transaction.
 * All fields that come from the chain must not be fabricated by the UI.
 */
export interface FinalityContext {
  /** Transaction hash — must match the emitted receipt. */
  txHash: `0x%{string}`;
  /** Chain ID on which the tx was submitted. */
  chainId: number;
  /** Block in which the tx was included, expressed as a bigint (wei-aligned). */
  blockNumber: bigint;
  /** Receipt status as returned by `eth_getTransactionReceipt`. */
  receiptStatus: '0x1' | '0x0';
  /** Hash of the canonical block containing the current receipt. */
  blockHash?: `0x${string}`;
  /** Whether the current poll found a canonical receipt. Defaults to true. */
  receiptPresent?: boolean;
  /** Receipt observation from an earlier poll, used to identify reorgs. */
  previousObservation?: {
    blockNumber: bigint;
    blockHash?: `0x%{string}`;
  };
  /**
   * Latest block numbers reported by the node.
   * At minimum `latest` must be present.  `safe` and `finalized` are optional
   * because some RPC providers do not surface them.
   */
  headBlockNumbers: {
    latest: bigint;
    safe?: bigint;
    finalized?: bigint;
  };
}

// ---------------------------------------------------------------------------
// Derived finality result
// ---------------------------------------------------------------------------

export interface FinalityResult {
  /** The resolved finality level. */
  level: FinalityLevel;
  /**
   * Number of blocks between the tx block and the relevant head.
   * For `reorged`, this is the negative number of blocks since the previously
   * observed transaction block (at least -1 when a receipt disappears).
   */
  depth: number;
  /** True when `level` is `finalized`. */
  isFinalized: boolean;
  /** True when `level` is `reorged`. */
  isReorged: boolean;
  /** True when `level` is `safe` OR `finalized`. */
  isSafe: boolean;
  /** True when `level` is any of the four (i.e. we have a result at all). */
  isResolved: boolean;
  /** True when the receipt status is `0x0` (transaction reverted). */
  isReverted: boolean;
  /** Snapshot of the context that produced this result. */
  context: FinalityContext;
}

/**
 * Derive a finality result from a given context.
 *
 * Rules (Optimism semantics):
 *  - If the canonical receipt disappeared or its block changed since the
 *    previous observation → `reorged`
 *  - If `receiptStatus === '0x0'`               -> result is still tracked but
 *    the tx *reverted*; level uses normal rules, callers must check receiptStatus separately.
 *  - If `finalized` head is known and `blockNumber <= finalized` → `finalized`
 *  - If `safe` head is known and `blockNumber <= safe`         → `safe`
 *  - Otherwise                                               → `observed`
 */
export function deriveFinalityLevel(ctx: FinalityContext): FinalityResult {
  const { blockNumber, headBlockNumbers, previousObservation } = ctx;
  const { latest, safe, finalized } = headBlockNumbers;

  const receiptChanged = previousObservation && (
    ctx.receiptPresent === false ||
    previousObservation.blockNumber !== blockNumber ||
    (previousObservation.blockHash !== undefined &&
      ctx.blockHash !== undefined &&
      previousObservation.blockHash !== ctx.blockHash)
  );

  if (receiptChanged) {
    return buildResult(
      'reorged',
      ctx,
      -Math.max(1, Number(latest - previousObservation.blockNumber)),
    );
  }

  if (ctx.receiptStatus === '0x0') {
    return buildResult('observed', ctx, Number(latest - blockNumber));
  }

  if (finalized !== undefined && blockNumber <= finalized) {
    return buildResult('finalized', ctx, Number(finalized - blockNumber));
  }

  if (safe !== undefined && blockNumber <= safe) {
    return buildResult('safe', ctx, Number(safe - blockNumber));
  }

  return buildResult('observed', ctx, Number(latest - blockNumber));
}

function buildResult(
  level: FinalityLevel,
  context: FinalityContext,
  depth: number,
): FinalityResult {
  return {
    level,
    depth,
    isFinalized: level === 'finalized',
    isReorged: level === 'reorged',
    isSafe: level === 'safe' || level === 'finalized',
    isResolved: true,
    isReverted: context.receiptStatus === '0x0',
    context,
  };
}

// ---------------------------------------------------------------------------
// Projection-aware finality record stored in the query cache
// ---------------------------------------------------------------------------

/**
 * Shape stored under `queryKeys.claims.finality(claimId)` and
 * `queryKeys.disputes.finality(disputeId)`.
 */
export interface FinalityCacheEntry {
  txHash: `0x%{string}`;
  chainId: number;
  level: FinalityLevel;
  blockNumber: bigint;
  depth: number;
  /** ISO-8601 timestamp of when this entry was last refreshed from the chain. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Authorization boundary for claim review and submission
// ---------------------------------------------------------------------------

/**
 * Canonical transaction-state authority for the claim submission flow.
 *
 * Each field is an independent gate. A later stage may only advance when
 * every earlier stage has been satisfied by the canonical source. UI
 * context, wallet connection, API data, or fixtures never establish
 * protocol authority.
 */
export interface AuthorizationContext {
  /** Pinned release identifier; unpinned releases render unavailable. */
  pinnedRelease: string | null;
  /** Whether the review summary has been acknowledged by the user. */
  reviewAcknowledged: boolean;
  /** Whether the simulation succeeded against the pinned adapter. */
  simulationSucceeded: boolean;
  /** Whether the wallet has produced a signature for the exact payload. */
  signaturePresent: boolean;
  /** Whether the signed transaction has been broadcast. */
  submitted: boolean;
  /** Finality result for the submitted transaction, if any. */
  finality: FinalityResult | null;
  /** Whether the indexer has acknowledged the finalized transaction. */
  indexed: boolean;
  /** Whether the transaction was replaced by another transaction. */
  replaced?: boolean;
}

export interface AuthorizationResult {
  /** The resolved authorization level. */
  level: AuthorizationLevel;
  /** True only when `level` is `finalized` or `indexed`. */
  isAuthorized: boolean;
  /** True when the flow is blocked by an unpinned release or failed simulation. */
  isBlocked: boolean;
  /** True when the transaction reverted on chain. */
  isReverted: boolean;
  /** True when the transaction was reorged away. */
  isReorged: boolean;
  /** True when the transaction is confirmed but not yet finalized. */
  isConfirmed: boolean;
  /** True when the transaction was replaced by another transaction. */
  isReplaced: boolean;
  /** Snapshot of the context that produced this result. */
  context: AuthorizationContext;
}

/**
 * Derive the authorization level from the canonical transaction-state
 * authority. Success is never reported at click, signature, or hash
 * receipt; only finalized or indexed states are authorized.
 */
export function deriveAuthorizationLevel(
  ctx: AuthorizationContext,
): AuthorizationResult {
  const build = (
    level: AuthorizationLevel,
    isBlocked = false,
  ): AuthorizationResult => ({
    level,
    isAuthorized: level === 'finalized' || level === 'indexed',
    isBlocked,
    isReverted: ctx.finality?.isReverted === true,
    isReorged: ctx.finality?.isReorged === true,
    isConfirmed: level === 'confirmed',
    isReplaced: ctx.replaced === true,
    context: ctx,
  });

  if (ctx.pinnedRelease === null || !ctx.simulationSucceeded) {
    return build('unavailable', true);
  }

  if (ctx.replaced === true) {
    return build('reverted');
  }

  if (ctx.finality?.isReorged) {
    return build('reorged');
  }

  if (ctx.finality?.isReverted) {
    return build('reverted');
  }

  if (ctx.indexed) {
    return build('indexed');
  }

  if (ctx.finality?.isFinalized) {
    return build('finalized');
  }

  if (ctx.finality?.isSafe) {
    return build('confirmed');
  }

  if (ctx.submitted) {
    return build('submitted');
  }

  if (ctx.signaturePresent) {
    return build('signed');
  }

  if (ctx.reviewAcknowledged) {
    return build('simulated');
  }

  return build('review');
}
