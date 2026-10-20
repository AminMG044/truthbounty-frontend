/* eslint-disable @typescript-eslint/no-explicit-any -- test doubles for the wagmi boundary */
/**
 * Integration tests for opening a dispute.
 *
 * The real hooks run end to end — context read, validation, simulation and
 * submission — with only the wagmi/RPC boundary mocked. Lifecycle state comes
 * from the receipt; nothing is projected or synthesised.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useAccount,
  useBlockNumber,
  useChainId,
  usePublicClient,
  useWriteContract,
} from 'wagmi';
import { useDisputeContext } from '@/hooks/useDisputeContext';
import { useDisputeSubmission } from '@/hooks/useDisputeSubmission';
import type {
  DisputeContext,
  DisputeSubmissionPayload,
  DisputeTransaction,
} from '@/app/types/dispute';

// Mock the wagmi boundary only.
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useBlockNumber: jest.fn(),
  useChainId: jest.fn(),
  usePublicClient: jest.fn(),
  useWriteContract: jest.fn(),
}));

jest.mock('@/lib/contracts/registry', () => ({
  getContractAddress: jest.fn(() => '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'),
  // Literal lives inside the hoisted factory: outer consts are not initialised
  // when the module registry first evaluates this module.
  getContractAbi: jest.fn(() => [
    {
      type: 'function',
      name: 'openDispute',
      stateMutability: 'payable',
      inputs: [
        { name: 'claimId', type: 'bytes32' },
        { name: 'reason', type: 'string' },
        { name: 'bondAmount', type: 'uint256' },
      ],
      outputs: [],
    },
  ]),
  getProtocolVersion: jest.fn(() => '2.0.0'),
  getReleaseChainId: jest.fn(() => 11155420),
  getProtocolRelease: jest.fn(() => ({
    manifest: {
      protocolVersion: '2.0.0',
      releaseId: 'v2.0.0-sepolia',
      gitCommit: '5333c0acb9ccfb8a6a37ae76b3397d06781f0119',
      compilerVersion: 'foundry-0.2.0',
      chainId: 11155420,
      deploymentBlock: 0,
      abiVersion: '2.0.0',
      eventSchemaVersion: '2.0.0',
      parameterSetVersion: '2.0.0',
      contracts: {
        TruthBountyWeighted: {
          proxy: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          implementation: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        },
      },
    },
    addresses: {
      chainId: 11155420,
      TruthBountyWeighted: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    },
    abis: { TruthBountyWeighted: [] },
    events: { version: '2.0.0', events: [] },
    parameters: {},
    roles: {},
    checksums: { version: '1', files: {} },
  })),
}));

jest.mock('@/lib/pending-transactions', () => ({
  trackPendingTransaction: jest.fn(),
  clearPendingTransaction: jest.fn(),
}));

const mockEstimateGas = jest.fn(async () => 187_654n);
const mockSimulateContract = jest.fn(async () => ({ request: {} }));
const mockWaitForTransactionReceipt = jest.fn(async () => ({
  status: 'success',
  blockNumber: 12_345_680n,
  gasUsed: 180_000n,
}));
const mockWriteContractAsync = jest.fn(
  async () => `0x${'cd'.repeat(32)}` as `0x${string}`,
);

const CHAIN_ID = 11155420;
const USER_ADDRESS = '0x1234567890123456789012345678901234567890';
const CONTRACT_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
/** Canonical 32-byte claim id, as the contract ABI requires. */
const CLAIM_ID = `0x${'1a'.repeat(32)}`;
const TX_HASH = `0x${'cd'.repeat(32)}`;

/**
 * Canonical context, supplied directly. The production reader only reports a
 * context once a release publishes the dispute readers, so the fixture stands
 * in for that release rather than for a mocked hook.
 */
const context: DisputeContext = {
  provisionalOutcome: {
    claimId: CLAIM_ID,
    decision: 'VERIFIED',
    votesFor: 7,
    votesAgainst: 3,
    totalStake: '5000000000000000000',
    outcomeAt: '2026-01-01T00:00:00.000Z',
    outcomeBlock: 12_345_600,
    isProvisional: true,
    isFinalized: false,
  },
  deadline: {
    claimId: CLAIM_ID,
    windowStartTime: '2026-01-01T00:00:00.000Z',
    windowEndTime: '2026-01-02T00:00:00.000Z',
    timeRemaining: 82_800,
    windowEndBlock: 12_387_000,
    currentBlock: 12_345_678,
    blocksRemaining: 41_322,
    isWindowOpen: true,
    isWindowClosed: false,
    hasActiveDispute: false,
  },
  bond: {
    claimId: CLAIM_ID,
    bondAmount: '1000000000000000000',
    slashAmount: '100000000000000000',
    slashPercentage: 10,
    potentialReward: '1500000000000000000',
    rewardMultiplier: 1.5,
  },
  walletPosition: {
    claimId: CLAIM_ID,
    userAddress: USER_ADDRESS,
    canChallenge: true,
    hasParticipatedInFirstRound: false,
    hasOpenedDispute: false,
    currentBalance: '5000000000000000000',
    hasSufficientBalance: true,
    balanceAfterBond: '4000000000000000000',
  },
  isEligible: true,
};

const payload: DisputeSubmissionPayload = {
  claimId: CLAIM_ID,
  reason: 'The verification process was clearly flawed and biased.',
  bondAmount: context.bond.bondAmount,
  userAddress: USER_ADDRESS,
};

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;

describe('Dispute opening flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: USER_ADDRESS,
      isConnected: true,
    } as any);
    mockUseChainId.mockReturnValue(CHAIN_ID);
    (useBlockNumber as jest.Mock).mockReturnValue({ data: BigInt(12_345_678) });

    mockEstimateGas.mockResolvedValue(187_654n);
    mockSimulateContract.mockResolvedValue({ request: {} });
    mockWaitForTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: 12_345_680n,
      gasUsed: 180_000n,
    });
    mockWriteContractAsync.mockResolvedValue(TX_HASH);

    (usePublicClient as jest.Mock).mockReturnValue({
      estimateGas: mockEstimateGas,
      simulateContract: mockSimulateContract,
      waitForTransactionReceipt: mockWaitForTransactionReceipt,
    });
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContractAsync: mockWriteContractAsync,
    });
  });

  it('requires a claim id before reading any dispute context', async () => {
    const { result } = renderHook(() =>
      useDisputeContext({ claimId: '', contractAddress: CONTRACT_ADDRESS, pollInterval: 0 })
    );

    await waitFor(() => {
      expect(result.current.error).toMatch(/claim id is required/i);
    });
    expect(result.current.context).toBeNull();
  });

  it('fails closed instead of reporting a dispute context it cannot read', async () => {
    const { result } = renderHook(() =>
      useDisputeContext({ claimId: CLAIM_ID, contractAddress: CONTRACT_ADDRESS, pollInterval: 0 })
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
    expect(result.current.context).toBeNull();
  });

  it('opens the dispute only once the receipt confirms the bond lock', async () => {
    const { result } = renderHook(() => useDisputeSubmission());

    const validation = result.current.validateDispute(context, payload);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const simulation = await result.current.simulateDispute(context, payload);
    expect(simulation.success).toBe(true);
    // Gas is the RPC estimate, never a hard-coded constant.
    expect(simulation.gasEstimate).toBe('187654');
    // The contract assigns the dispute id on-chain; it is never predicted.
    expect(simulation.projectedState?.disputeId).toBeUndefined();

    let transaction: DisputeTransaction | undefined;
    await act(async () => {
      transaction = await result.current.submitDispute(context, payload);
    });

    expect(mockWriteContractAsync).toHaveBeenCalledTimes(1);
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({
      hash: TX_HASH,
      confirmations: 1,
    });
    expect(transaction?.status).toBe('CONFIRMED');
    expect(transaction?.bondLocked).toBe(true);
    expect(transaction?.blockNumber).toBe(12_345_680);
    expect(transaction?.disputeId).toBeUndefined();
    expect(result.current.lastTransaction?.status).toBe('CONFIRMED');
  });

  it('reports a reverted receipt and locks no bond', async () => {
    mockWaitForTransactionReceipt.mockResolvedValue({
      status: 'reverted',
      blockNumber: 12_345_681n,
      gasUsed: 21_000n,
    });

    const { result } = renderHook(() => useDisputeSubmission());

    let transaction: DisputeTransaction | undefined;
    await act(async () => {
      transaction = await result.current.submitDispute(context, payload);
    });

    expect(transaction).toMatchObject({ status: 'REVERTED', bondLocked: false });
    expect(result.current.lastTransaction?.bondLocked).toBe(false);
  });

  it('keeps the submitted hash when the transaction cannot be confirmed', async () => {
    (usePublicClient as jest.Mock).mockReturnValue({
      estimateGas: mockEstimateGas,
      simulateContract: mockSimulateContract,
    });

    const { result } = renderHook(() => useDisputeSubmission());

    await expect(
      result.current.submitDispute(context, payload)
    ).rejects.toThrow(/confirm/i);

    // The real hash survives the confirmation failure so the user can follow it.
    await waitFor(() => {
      expect(result.current.lastTransaction?.transactionHash).toBe(TX_HASH);
    });
    expect(result.current.lastTransaction?.bondLocked).toBe(false);
  });

  it('refuses to build a call when the canonical ABI declares no dispute entrypoint', async () => {
    const { result } = renderHook(() => useDisputeSubmission({ abi: [] }));

    expect(result.current.isDisputeSupported).toBe(false);

    const simulation = await result.current.simulateDispute(context, payload);
    expect(simulation.success).toBe(false);
    expect(mockSimulateContract).not.toHaveBeenCalled();

    await expect(
      result.current.submitDispute(context, payload)
    ).rejects.toThrow(/declares no dispute-opening function/i);
    expect(mockWriteContractAsync).not.toHaveBeenCalled();
  });
});
