/**
 * Dispute opening integration boundary.
 *
 * The canonical dispute read adapter and pinned contract entrypoint are not
 * available yet. The composed flow must fail closed instead of fabricating
 * eligibility, calldata, transaction hashes, or reconciliation success.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useDisputeContext } from '@/hooks/useDisputeContext';
import { useDisputeSubmission } from '@/hooks/useDisputeSubmission';

const CONTRACT = '0x1111111111111111111111111111111111111111';

describe('Dispute Opening Integration — unavailable interface boundary', () => {
  it('does not fabricate an eligible context without the canonical read adapter', async () => {
    const { result } = renderHook(() =>
      useDisputeContext({
        claimId: `0x${'a'.repeat(64)}`,
        contractAddress: CONTRACT,
        expectedChainId: 11155420,
        pollInterval: 0,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.context).toBeNull();
    expect(result.current.error).toBe('Not implemented');
  });

  it('reports submission as unsupported when the pinned ABI has no entrypoint', () => {
    const { result } = renderHook(() => useDisputeSubmission());

    expect(result.current.isDisputeSupported).toBe(false);
    expect(result.current.lastTransaction).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSimulating).toBe(false);
  });

  it('rejects malformed configuration before presenting context', async () => {
    const { result } = renderHook(() =>
      useDisputeContext({
        claimId: `0x${'a'.repeat(64)}`,
        contractAddress: 'invalid',
        expectedChainId: 11155420,
        pollInterval: 0,
      }),
    );

    await waitFor(() =>
      expect(result.current.error).toMatch(/invalid contract address/i),
    );
    expect(result.current.context).toBeNull();
  });

  it('performs no adapter work while the flow is disabled', () => {
    const { result } = renderHook(() =>
      useDisputeContext({
        claimId: `0x${'a'.repeat(64)}`,
        contractAddress: CONTRACT,
        expectedChainId: 11155420,
        pollInterval: 0,
        enabled: false,
      }),
    );

    expect(result.current.context).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
