/* eslint-disable @typescript-eslint/no-explicit-any -- Wagmi hook test doubles */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import {
  getDisputeStatus,
  isDuplicateSubmission,
  useDisputeReconciliation,
  wasDisputeOpened,
  wasTransactionReplaced,
} from '../useDisputeReconciliation';
import type { DisputeReconciliationResult, DisputeTransaction } from '@/app/types/dispute';
import { clearPendingTransaction, trackPendingTransaction } from '@/lib/pending-transactions';

jest.mock('wagmi', () => ({
  useWaitForTransactionReceipt: jest.fn(),
  usePublicClient: jest.fn(),
}));
jest.mock('@/lib/pending-transactions', () => ({
  trackPendingTransaction: jest.fn(),
  clearPendingTransaction: jest.fn(),
}));

const mockUseReceipt = useWaitForTransactionReceipt as jest.MockedFunction<typeof useWaitForTransactionReceipt>;
const mockUsePublicClient = usePublicClient as jest.MockedFunction<typeof usePublicClient>;
const mockTrack = trackPendingTransaction as jest.MockedFunction<typeof trackPendingTransaction>;
const mockClear = clearPendingTransaction as jest.MockedFunction<typeof clearPendingTransaction>;

const transaction: DisputeTransaction = {
  transactionHash: '0xabc123def456789012345678901234567890123456789012345678901234abcd',
  from: '0x1234567890123456789012345678901234567890',
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
  status: 'PENDING',
  claimId: 'claim-123',
  reason: 'The verification was flawed',
  bondAmount: '1000000000000000000',
  timestamp: '2026-10-01T00:00:00.000Z',
  bondLocked: false,
};

function receipt(status: 'success' | 'reverted') {
  return {
    status,
    blockNumber: 12345680n,
    transactionHash: transaction.transactionHash,
    logs: [],
  };
}

describe('useDisputeReconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePublicClient.mockReturnValue({} as any);
    mockUseReceipt.mockReturnValue({ data: undefined, isLoading: true, error: null } as any);
  });

  it('tracks a submitted dispute while its receipt is pending', async () => {
    const { result } = renderHook(() => useDisputeReconciliation({ transaction }));

    expect(result.current.isWaiting).toBe(true);
    await waitFor(() => expect(mockTrack).toHaveBeenCalledTimes(1));
    expect(mockTrack).toHaveBeenCalledWith(expect.objectContaining({
      id: transaction.transactionHash,
      kind: 'dispute',
      machineState: 'submitted',
    }));
  });

  it('fails closed after a successful receipt until reconciliation adapters exist', async () => {
    mockUseReceipt.mockReturnValue({ data: receipt('success'), isLoading: false, error: null } as any);
    const onConfirmed = jest.fn();
    const { result } = renderHook(() => useDisputeReconciliation({ transaction, onConfirmed }));

    await waitFor(() => expect(result.current.result).not.toBeNull());
    expect(result.current.result).toMatchObject({
      status: 'reverted',
      bondLocked: false,
      error: 'Failed to extract dispute ID from transaction logs',
    });
    expect(result.current.disputeId).toBeNull();
    expect(result.current.bondLocked).toBe(false);
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('reports a reverted receipt and clears the pending entry', async () => {
    mockUseReceipt.mockReturnValue({ data: receipt('reverted'), isLoading: false, error: null } as any);
    const onReverted = jest.fn();
    const { result } = renderHook(() => useDisputeReconciliation({ transaction, onReverted }));

    await waitFor(() => expect(result.current.result?.status).toBe('reverted'));
    expect(result.current.result).toMatchObject({
      bondLocked: false,
      error: 'Transaction reverted',
      revertReason: 'Unknown revert reason',
    });
    expect(mockClear).toHaveBeenCalledWith(transaction.transactionHash);
    expect(onReverted).toHaveBeenCalledWith(result.current.result);
  });

  it('reports receipt timeout without presenting a dispute as opened', async () => {
    mockUseReceipt.mockReturnValue({ data: undefined, isLoading: false, error: new Error('timed out') } as any);
    const onTimeout = jest.fn();
    const { result } = renderHook(() => useDisputeReconciliation({ transaction, onTimeout }));

    await waitFor(() => expect(result.current.result?.status).toBe('timeout'));
    expect(result.current.bondLocked).toBe(false);
    expect(mockClear).toHaveBeenCalledWith(transaction.transactionHash);
    expect(onTimeout).toHaveBeenCalledWith(result.current.result);
  });

  it('returns null from manual reconciliation without a transaction or receipt', async () => {
    const { result } = renderHook(() => useDisputeReconciliation({ transaction: null }));
    let reconciliation: DisputeReconciliationResult | null = null;
    await act(async () => {
      reconciliation = await result.current.reconcile();
    });
    expect(reconciliation).toBeNull();
  });
});

describe('dispute reconciliation utilities', () => {
  const confirmed: DisputeReconciliationResult = {
    transactionHash: transaction.transactionHash,
    status: 'confirmed',
    bondLocked: true,
    bondAmount: transaction.bondAmount,
    newBalance: '0',
  };

  it('recognizes only confirmed, bond-locked results as opened', () => {
    expect(wasDisputeOpened(confirmed)).toBe(true);
    expect(wasDisputeOpened({ ...confirmed, bondLocked: false })).toBe(false);
    expect(wasDisputeOpened(null)).toBe(false);
  });

  it('formats canonical reconciliation statuses', () => {
    expect(getDisputeStatus(confirmed)).toBe('Dispute opened successfully');
    expect(getDisputeStatus({ ...confirmed, status: 'reverted', bondLocked: false, revertReason: 'Contract paused' })).toBe('Contract paused');
    expect(getDisputeStatus({ ...confirmed, status: 'timeout' })).toBe('Transaction confirmation timeout');
    expect(getDisputeStatus(null)).toBe('Unknown');
  });

  it('detects pending and confirmed duplicate submissions', () => {
    expect(isDuplicateSubmission(transaction, transaction.claimId)).toBe(true);
    expect(isDuplicateSubmission(transaction, 'another-claim')).toBe(false);
    expect(isDuplicateSubmission({ ...transaction, status: 'CONFIRMED' }, 'another-claim')).toBe(true);
    expect(isDuplicateSubmission(null, transaction.claimId)).toBe(false);
  });

  it('detects replacement transaction hashes', () => {
    expect(wasTransactionReplaced('0x01', '0x02')).toBe(true);
    expect(wasTransactionReplaced('0x01', '0x01')).toBe(false);
    expect(wasTransactionReplaced('0x01', undefined)).toBe(false);
  });
});
