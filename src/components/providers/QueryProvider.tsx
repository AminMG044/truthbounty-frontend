// src/components/providers/QueryProvider.tsx

'use client';

import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/app/queries/queryClient';
import { WebSocketProvider } from './WebSocketProvider';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { WalletScopedCacheSync } from '@/hooks/useWalletScopedCache';
import { ReorgReconciliationSync } from './ReorgReconciliationSync';
import { QueryDevtools } from './QueryDevtools';
import { useSessionReconciliation } from '@/hooks/useSessionReconciliation';
import { getAuthSession } from '@/lib/session-store';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Component that handles real-time data sync when WebSocket is connected
 */
function RealtimeDataSync() {
  useRealtimeData();
  return null;
}

function WalletScopedRealtimeProvider({
  children,
  wsUrl,
}: {
  children: ReactNode;
  wsUrl: string;
}) {
  const reconciliation = useSessionReconciliation();
  const session = reconciliation.hasValidSession ? getAuthSession() : null;

  return (
    <WebSocketProvider
      config={{
        url: wsUrl,
        authToken: session?.token,
        sessionScope: reconciliation.sessionScope,
        reconnectAttempts: 5,
        reconnectInterval: 3000,
        heartbeatInterval: 30000,
      }}
    >
      {children}
    </WebSocketProvider>
  );
}

export function QueryProvider({ children }: QueryProviderProps) {
  // WebSocket URL - can be configured via environment variable
  const wsUrl = typeof window !== 'undefined' 
    ?  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws"
    : 'ws://localhost:8080/ws';

  return (
    <QueryClientProvider client={queryClient}>
      <WalletScopedRealtimeProvider wsUrl={wsUrl}>
        <RealtimeDataSync />
        {/* V2-FE-063: drop wallet-scoped cache on account/chain change */}
        <WalletScopedCacheSync />
        <ReorgReconciliationSync />
        {children}
      </WalletScopedRealtimeProvider>
      {/* DevTools are gated by process.env.NODE_ENV — never rendered in production. */}
      <QueryDevtools />
    </QueryClientProvider>
  );
}
