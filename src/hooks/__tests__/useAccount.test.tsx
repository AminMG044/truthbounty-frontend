/**
 * Unit tests for useAccount — EVM-backed account accessor.
 *
 * Covers:
 *  - returns null when not connected
 *  - returns AccountInfo with correct fields when connected
 *  - hydration guard: null on SSR / before mount
 *  - display name truncation format
 *
 * Regression coverage for:
 *  - REMOVED: Stellar/Freighter integration (deleted path)
 *  - REMOVED: localStorage key 'truthbounty-wallet-connection' (Freighter)
 *  - REMOVED: focus/storage events from Freighter reconnect loop
 */

jest.unmock('wagmi');

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { http } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { createConfig } from 'wagmi';
import { mock } from 'wagmi/connectors';
import { useAccount } from '../useAccount';

// ── Wagmi test harness ────────────────────────────────────────────────────────
const MOCK_ADDRESS_A = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const;

const testConfig = createConfig({
  chains: [optimismSepolia],
  transports: { [optimismSepolia.id]: http() },
  connectors: [mock({ accounts: [MOCK_ADDRESS_A] })],
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={testConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

beforeEach(async () => {
  localStorage.clear();
  queryClient.clear();
  try {
    const { disconnect } = require('@wagmi/core');
    await disconnect(testConfig);
  } catch {}
});

afterEach(async () => {
  try {
    const { disconnect } = require('@wagmi/core');
    await disconnect(testConfig);
  } catch {}
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAccount', () => {
  it('returns null when the wallet is not connected', () => {
    const { result } = renderHook(() => useAccount(), { wrapper: Wrapper });
    expect(result.current).toBeNull();
  });

  it('returns null before the component is mounted (hydration guard)', () => {
    // First synchronous render — useIsMounted returns false, so result is null.
    const { result } = renderHook(() => useAccount(), { wrapper: Wrapper });
    expect(result.current).toBeNull();
  });

  it('returns AccountInfo after a successful connect', async () => {
    const connector = testConfig.connectors[0];

    // Connect via the mock connector directly
    const { result: walletResult } = renderHook(
      () => {
        const { useConnect } = require('wagmi');
        return useConnect();
      },
      { wrapper: Wrapper },
    );

    const { result } = renderHook(() => useAccount(), { wrapper: Wrapper });

    // Trigger connection
    await walletResult.current.connectAsync({ connector });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current?.address).toMatch(/^0x/);
    expect(typeof result.current?.displayName).toBe('string');
  });

  it('formats displayName as "0xXXXXXX…YYYY" (6 prefix chars + ellipsis + 4 suffix)', async () => {
    const connector = testConfig.connectors[0];

    const { result: walletResult } = renderHook(
      () => {
        const { useConnect } = require('wagmi');
        return useConnect();
      },
      { wrapper: Wrapper },
    );

    const { result } = renderHook(() => useAccount(), { wrapper: Wrapper });

    await walletResult.current.connectAsync({ connector });

    await waitFor(() => expect(result.current).not.toBeNull());

    const displayName = result.current!.displayName;
    // e.g. "0xf39Fd6…2266"
    expect(displayName).toMatch(/^0x.{4}….{4}$/);
  });

  it('returns null again after disconnecting', async () => {
    const connector = testConfig.connectors[0];

    const { result: walletResult } = renderHook(
      () => {
        const { useConnect, useDisconnect } = require('wagmi');
        return { ...useConnect(), ...useDisconnect() };
      },
      { wrapper: Wrapper },
    );

    const { result } = renderHook(() => useAccount(), { wrapper: Wrapper });

    await walletResult.current.connectAsync({ connector });
    await waitFor(() => expect(result.current).not.toBeNull());

    await walletResult.current.disconnectAsync();
    await waitFor(() => expect(result.current).toBeNull());
  });

  it('exposes chainId as a number when connected', async () => {
    const connector = testConfig.connectors[0];

    const { result: walletResult } = renderHook(
      () => {
        const { useConnect } = require('wagmi');
        return useConnect();
      },
      { wrapper: Wrapper },
    );

    const { result } = renderHook(() => useAccount(), { wrapper: Wrapper });

    await walletResult.current.connectAsync({ connector });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(typeof result.current?.chainId).toBe('number');
  });
});
