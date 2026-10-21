/**
 * V2 Transaction State Types - Canonical EVM/Optimism
 *
 * Represents transaction lifecycle with blockchain-aware state transitions:
 * review -> simulation -> signature -> submitted -> confirmed -> safe -> finalized -> indexing -> indexed
 *
 * Each state is exclusive and represents validated on-chain facts, never fabricated state.
 * Security: Always validate chain, address, amount, artifact version against contracts.
 *
 * Authorization boundary: no success may be shown at review, simulation, signature,
 * or hash receipt. Success is only valid once the canonical transaction-state
 * authority reports confirmed/safe/finalized/indexed with a matching receipt.
 */

import type { Address } from 'viem';

/**
 * Review state: exact review summary before any authorization.
 * - No transaction exists yet; no hash, no receipt, no success.
 * - Must display chain, contract, method, parameters, and costs.
 * - Authorization is disabled unless the release is pinned and simulation succeeds.
 */
export interface TransactionReview {
  state: 'review';
  chainId: number; // Canonical chain ID (10 for Optimism)
  contractAddress: Address; // Target contract
  method: string; // Contract method selector/name
  parameters: Record<string, unknown>; // Exact reviewed parameters
  costs: {
    estimatedGas: bigint;
    estimatedFeeWei: bigint;
    maxFeePerGasWei?: bigint;
    maxPriorityFeePerGasWei?: bigint;
  };
  releasePinned: boolean; // Unpinned release disables authorization
  simulationPassed: boolean; // Simulation failure disables authorization
  recoverableTransactionReference?: string; // Recoverable reference for retry/recovery
  hash?: never;
  receipt?: never;
}

/**
 * Simulation state: dry-run result before signature.
 * - No transaction exists yet; no hash, no receipt, no success.
 * - Simulation failure disables authorization.
 */
export interface TransactionSimulation {
  state: 'simulation';
  chainId: number;
  contractAddress: Address;
  method: string;
  parameters: Record<string, unknown>;
  costs: {
    estimatedGas: bigint;
    estimatedFeeWei: bigint;
    maxFeePerGasWei?: bigint;
    maxPriorityFeePerGasWei?: bigint;
  };
  releasePinned: boolean;
  simulationPassed: boolean;
  simulationError?: string;
  recoverableTransactionReference?: string;
  hash?: never;
  receipt?: never;
}

/**
 * Signature state: awaiting wallet signature.
 * - No hash receipt yet; no success.
 * - Rejection must remain distinct from failure/revert.
 */
export interface TransactionSignature {
  state: 'signature';
  chainId: number;
  contractAddress: Address;
  method: string;
  parameters: Record<string, unknown>;
  costs: {
    estimatedGas: bigint;
    estimatedFeeWei: bigint;
    maxFeePerGasWei?: bigint;
    maxPriorityFeePerGasWei?: bigint;
  };
  releasePinned: boolean;
  simulationPassed: boolean;
  recoverableTransactionReference?: string;
  hash?: never;
  receipt?: never;
}

/**
 * Transaction submission state: submitted to mempool
 * - Hash is from blockchain (submitted to RPC, not generated)
 * - Pending confirmation
 * - May fail or be reverted
 */
export interface TransactionSubmitted {
  state: 'submitted';
  hash: string; // Validated 0x-prefixed hash from RPC
  fromAddress: Address; // Validated address
  toAddress: Address; // Contract or recipient address
  chainId: number; // Canonical chain ID (10 for Optimism)
  timestamp: number; // Submission time
  amount?: string; // Wei amount (exact integer)
  data?: string; // Transaction data (0x-prefixed)
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
  blockNumber?: never;
  confirmations?: never;
  receipts?: never;
}

/**
 * Transaction confirmed state: included in block
 * - At least 1 confirmation (in a mined block)
 * - Still subject to reorg on L1 for Optimism
 * - Receipt available
 * - Status: success | reverted | failed
 */
export interface TransactionConfirmed {
  state: 'confirmed';
  hash: string;
  fromAddress: Address;
  toAddress: Address;
  chainId: number;
  timestamp: number;
  amount?: string;
  data?: string;
  blockNumber: bigint;
  blockHash: string;
  transactionIndex: number;
  confirmations: number;
  receipt: {
    status: 'success' | 'reverted' | 'failed';
    gasUsed: bigint;
    cumulativeGasUsed: bigint;
    contractAddress?: Address;
    logs: Array<{
      address: Address;
      topics: string[];
      data: string;
    }>;
  };
}

/**
 * Transaction safe state: sufficient confirmations
 * - Optimism: 2+ confirmations (safe from short-term reorg)
 * - Definitive receipt with status
 * - Contract state likely stable for reads
 */
export interface TransactionSafe {
  state: 'safe';
  hash: string;
  fromAddress: Address;
  toAddress: Address;
  chainId: number;
  timestamp: number;
  amount?: string;
  data?: string;
  blockNumber: bigint;
  blockHash: string;
  transactionIndex: number;
  confirmations: number;
  receipt: {
    status: 'success' | 'reverted' | 'failed';
    gasUsed: bigint;
    cumulativeGasUsed: bigint;
    contractAddress?: Address;
    logs: Array<{
      address: Address;
      topics: string[];
      data: string;
    }>;
  };
  safeBlockNumber: bigint; // Block number from canonical safe head
}

/**
 * Transaction finalized state: canonical and immutable
 * - Optimism: Included in committed L2 batch on L1
 * - Cannot be reorganized or reverted
 * - Contract state is authoritative
 * - For Optimism: ~12 minutes after submission (batch finality)
 */
export interface TransactionFinalized {
  state: 'finalized';
  hash: string;
  fromAddress: Address;
  toAddress: Address;
  chainId: number;
  timestamp: number;
  amount?: string;
  data?: string;
  blockNumber: bigint;
  blockHash: string;
  transactionIndex: number;
  confirmations: number;
  receipt: {
    status: 'success' | 'reverted' | 'failed';
    gasUsed: bigint;
    cumulativeGasUsed: bigint;
    contractAddress?: Address;
    logs: Array<{
      address: Address;
      topics: string[];
      data: string;
    }>;
  };
  finalizedBlockNumber: bigint; // Block included in finalized state
  l1TransactionHash?: string; // L1 batch transaction hash (Optimism)
  l1BlockNumber?: bigint; // L1 block number of batch
}

/**
 * Transaction indexing state: being indexed by blockchain indexers
 * - Finalized on chain but not yet indexed by subgraph/indexer
 * - Useful for UX: show "Indexing" state between finalized and indexed
 * - Do NOT trust subgraph/indexer state until fully indexed
 */
export interface TransactionIndexing {
  state: 'indexing';
  hash: string;
  fromAddress: Address;
  toAddress: Address;
  chainId: number;
  timestamp: number;
  amount?: string;
  data?: string;
  blockNumber: bigint;
  blockHash: string;
  transactionIndex: number;
  confirmations: number;
  receipt: {
    status: 'success' | 'reverted' | 'failed';
    gasUsed: bigint;
    cumulativeGasUsed: bigint;
    contractAddress?: Address;
    logs: Array<{
      address: Address;
      topics: string[];
      data: string;
    }>;
  };
  finalizedBlockNumber: bigint;
  l1TransactionHash?: string;
  l1BlockNumber?: bigint;
  indexingProgress?: number; // 0-100% if available
}

/**
 * Transaction indexed state: fully indexed and queryable
 * - Subgraph/indexer has processed the transaction
 * - All events and state changes are available through indexer
 * - Safe to display indexed data (rewards, verdicts, etc)
 * - Contract and indexer state are synchronized
 */
export interface TransactionIndexed {
  state: 'indexed';
  hash: string;
  fromAddress: Address;
  toAddress: Address;
  chainId: number;
  timestamp: number;
  amount?: string;
  data?: string;
  blockNumber: bigint;
  blockHash: string;
  transactionIndex: number;
  confirmations: number;
  receipt: {
    status: 'success' | 'reverted' | 'failed';
    gasUsed: bigint;
    cumulativeGasUsed: bigint;
    contractAddress?: Address;
    logs: Array<{
      address: Address;
      topics: string[];
      data: string;
    }>;
  };
  finalizedBlockNumber: bigint;
  l1TransactionHash?: string;
  l1BlockNumber?: bigint;
  indexedAt: number; // Timestamp when indexed
}

/**
 * Union of all transaction states
 */
export type TransactionState =
  | TransactionReview
  | TransactionSimulation
  | TransactionSignature
  | TransactionSubmitted
  | TransactionConfirmed
  | TransactionSafe
  | TransactionFinalized
  | TransactionIndexing
  | TransactionIndexed;

/**
 * Transaction state name for type guards and state machines
 */
export type TransactionStateName = TransactionState['state'];

/**
 * Failed/rejected transaction state (terminal)
 */
export interface TransactionFailed {
  state: 'failed' | 'rejected' | 'replaced' | 'reverted' | 'reorged';
  hash?: string;
  fromAddress?: Address;
  toAddress?: Address;
  chainId: number;
  timestamp: number;
  reason:
    | 'insufficient-balance'
    | 'nonce-too-low'
    | 'replacement-underpriced'
    | 'revert'
    | 'timeout'
    | 'user-rejected'
    | 'network-error'
    | 'replaced'
    | 'reorged'
    | 'unknown';
  error?: string; // Raw error message
  recoverableTransactionReference?: string; // Recoverable reference for retry/recovery
  receipt?: {
    status: 'reverted' | 'failed';
    gasUsed?: bigint;
    cumulativeGasUsed?: bigint;
    logs: Array<{
      address: Address;
      topics: string[];
      data: string;
    }>;
  };
}

/**
 * Projection-lag state: API/indexer projection is behind canonical contract state.
 * - Distinct from finalized and indexed; must not be shown as success.
 * - Contract state remains canonical for mutations.
 */
export interface TransactionProjectionLag {
  state: 'projection-lag';
  hash: string;
  chainId: number;
  timestamp: number;
  canonicalBlockNumber: bigint;
  projectedBlockNumber: bigint;
  lagBlocks: number;
  recoverableTransactionReference?: string;
}

/**
 * Complete transaction including failed states
 */
export type Transaction = TransactionState | TransactionFailed | TransactionProjectionLag;

/**
 * Transaction metadata for stale state detection
 */
export interface TransactionMetadata {
  id: string; // Local unique identifier
  createdAt: number;
  updatedAt: number;
  expiresAt?: number; // When to consider stale
  retryCount: number;
  lastRetryAt?: number;
  userAction?: string; // What user was doing when submitted
}

/**
 * Stale transaction detection
 * Prevents showing outdated success/pending states
 */
export interface StalenessConfig {
  maxAgeMs: number; // Max time to trust state without refresh
  maxRetries: number; // Max retry attempts before giving up
  retryDelayMs: number; // Delay between retries
  maxConfirmationTimeMs: number; // Max time to wait for confirmation
}

/**
 * Alias for the terminal error states of a transaction.
 * Used by error surfaces to narrow the union without re-listing members.
 */
export type TransactionErrorState = Extract<Transaction, { state: 'failed' | 'rejected' | 'replaced' | 'reverted' | 'reorged' }>;
