/* eslint-disable @typescript-eslint/no-explicit-any -- typed hook test doubles */
/**
 * useDisputeContext fail-closed tests.
 *
 * The read adapters required for dispute context are intentionally unavailable
 * until the pinned API and contract handoff lands. These tests verify that the
 * hook exposes that boundary instead of fabricating an eligible context.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAccount, useBlockNumber, useChainId } from 'wagmi';
import {
  canOpenDispute,
  getDisputeTimeRemaining,
  useDisputeContext,
} from '../useDisputeContext';
import type { DisputeContext } from '@/app/types/dispute';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useBlockNumber: jest.fn(),
  useChainId: jest.fn(),
}));

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseBlockNumber = useBlockNumber as jest.MockedFunction<typeof useBlockNumber>;
const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;

describe('useDisputeContext', () => {
  const config = {
    claimId: 'claim-123',
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
    expectedChainId: 11155420,
    pollInterval: 0,
    enabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    } as any);
    mockUseBlockNumber.mockReturnValue({ data: 12345678n } as any);
    mockUseChainId.mockReturnValue(11155420);
  });

  it('fails closed while canonical dispute adapters are unavailable', async () => {
    const { result } = renderHook(() => useDisputeContext(config));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.context).toBeNull();
    expect(result.current.error).toBe('Not implemented');
  });

  it('does not fabricate context for a disconnected wallet', async () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);

    const { result } = renderHook(() => useDisputeContext(config));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.context).toBeNull();
    expect(result.current.error).toBe('Not implemented');
  });

  it('rejects a missing claim id before adapter access', async () => {
    const { result } = renderHook(() =>
      useDisputeContext({ ...config, claimId: '' }),
    );

    await waitFor(() =>
      expect(result.current.error).toBe('Claim ID is required'),
    );
    expect(result.current.context).toBeNull();
  });

  it('rejects an invalid contract address', async () => {
    const { result } = renderHook(() =>
      useDisputeContext({ ...config, contractAddress: 'invalid' }),
    );

    await waitFor(() =>
      expect(result.current.error).toContain('Invalid contract address'),
    );
    expect(result.current.context).toBeNull();
  });

  it('allows a manual retry without inventing a result', async () => {
    const { result } = renderHook(() => useDisputeContext(config));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.refetch();

    expect(result.current.context).toBeNull();
    expect(result.current.error).toBe('Not implemented');
  });

  it('does not fetch when disabled', () => {
    const { result } = renderHook(() =>
      useDisputeContext({ ...config, enabled: false }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.context).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('canOpenDispute', () => {
  it('returns true only for an explicitly eligible canonical context', () => {
    const eligible = {
      provisionalOutcome: {},
      deadline: {},
      bond: {},
      walletPosition: {},
      isEligible: true,
    } as DisputeContext;

    expect(canOpenDispute(eligible)).toBe(true);
    expect(canOpenDispute({ ...eligible, isEligible: false })).toBe(false);
    expect(canOpenDispute(null)).toBe(false);
  });
});

describe('getDisputeTimeRemaining', () => {
  it.each([
    [{ timeRemaining: 7260 }, '2h 1m'],
    [{ timeRemaining: 600 }, '10m'],
    [{ timeRemaining: 0 }, 'Expired'],
    [{ timeRemaining: -100 }, 'Expired'],
    [null, 'Expired'],
  ])('formats canonical deadline %p', (deadline, expected) => {
    expect(getDisputeTimeRemaining(deadline as any)).toBe(expected);
  });
});
