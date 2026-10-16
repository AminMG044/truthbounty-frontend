// src/app/providers.tsx

'use client';

import { ReactNode } from 'react';
import {
  QueryProvider,
  ThemeProvider,
  Web3Provider,
  RainbowKitThemedProvider,
  FeatureFlagProvider,
  FeatureFlagPanel,
  WalletStateGuard,
} from '@/components/providers';
import { OfflineCacheProvider } from '@/components/providers/OfflineCacheProvider';
import { SiweAuthProvider } from '@/context/SiweAuthProvider';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { IntegrityBoundary } from '@/components/security/IntegrityBoundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <Web3Provider>
        <QueryProvider>
          <RainbowKitThemedProvider>
            <SiweAuthProvider>
              <FeatureFlagProvider enablePersistence={true}>
                <OfflineCacheProvider>
                  <ErrorBoundary>
                    <IntegrityBoundary>
                      <WalletStateGuard>
                        {children}
                        {/* Feature flag panel for development debugging */}
                        <FeatureFlagPanel defaultOpen={false} position="bottom-right" />
                      </WalletStateGuard>
                    </IntegrityBoundary>
                  </ErrorBoundary>
                </OfflineCacheProvider>
              </FeatureFlagProvider>
            </SiweAuthProvider>
          </RainbowKitThemedProvider>
        </QueryProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}
