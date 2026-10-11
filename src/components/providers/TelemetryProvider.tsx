/**
 * TelemetryProvider — React context provider for privacy-safe telemetry.
 *
 * V2-FE-149 — TruthBounty Frontend
 *
 * Place TelemetryProvider inside the Providers tree (inside FeatureFlagProvider
 * so the PRIVACY_SAFE_TELEMETRY flag is accessible at mount time).
 *
 * ```tsx
 * <FeatureFlagProvider>
 *   <TelemetryProvider>
 *     {children}
 *   </TelemetryProvider>
 * </FeatureFlagProvider>
 * ```
 *
 * The provider:
 *  - Reads the PRIVACY_SAFE_TELEMETRY feature flag on mount.
 *  - Initialises a TelemetryClient with the application release string.
 *  - Exposes the client and `isEnabled` flag via TelemetryContext.
 *  - Re-initialises the client if the feature flag changes at runtime.
 *  - Accepts an optional `transport` prop for custom transports (e.g. Sentry).
 */

'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useFeatureFlags } from '@/components/providers/FeatureFlagProvider';
import {
  TelemetryClient,
  initialiseTelemetry,
  type TelemetryConfig,
} from '@/lib/telemetry';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface TelemetryContextValue {
  /** The active TelemetryClient instance. */
  client: TelemetryClient;
  /** Whether telemetry is currently enabled (both flag and config). */
  isEnabled: boolean;
}

export const TelemetryContext = createContext<TelemetryContextValue | null>(null);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TelemetryProviderProps {
  children: ReactNode;
  /**
   * Optional custom transport function.  Receives fully redacted events.
   * When not provided the default transport is used (console.debug in dev,
   * silent in production).
   *
   * Example — Sentry integration:
   * ```ts
   * transport: (event) => Sentry.captureEvent({ message: event.message, level: event.severity })
   * ```
   */
  transport?: TelemetryConfig['transport'];
  /**
   * Override for the application release string.
   * Defaults to NEXT_PUBLIC_PROTOCOL_RELEASE env var.
   */
  release?: string;
  /**
   * Additional redaction rules on top of the built-in ones.
   */
  customRedactionRules?: TelemetryConfig['customRedactionRules'];
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TelemetryProvider({
  children,
  transport,
  release,
  customRedactionRules,
}: TelemetryProviderProps) {
  const { isEnabled: isFlagEnabled } = useFeatureFlags();
  const flagActive = isFlagEnabled('PRIVACY_SAFE_TELEMETRY');

  const client = useMemo(() => {
    return initialiseTelemetry({
      enabled: flagActive,
      release: release ?? process.env.NEXT_PUBLIC_PROTOCOL_RELEASE,
      transport,
      customRedactionRules,
    });
    // Re-initialise when the flag or configuration changes
  }, [flagActive, release, transport, customRedactionRules]);

  const value = useMemo<TelemetryContextValue>(
    () => ({ client, isEnabled: flagActive && client.isEnabled }),
    [client, flagActive]
  );

  return (
    <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook (re-exported here for convenience)
// ---------------------------------------------------------------------------

/**
 * useTelemetryContext — direct access to the TelemetryContextValue.
 * Prefer `useTelemetry` from `@/hooks/useTelemetry` for component-level usage.
 * This hook is mainly useful for advanced providers or testing utilities.
 */
export function useTelemetryContext(): TelemetryContextValue {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    // Outside of TelemetryProvider — return a disabled client
    return {
      client: new TelemetryClient({ enabled: false }),
      isEnabled: false,
    };
  }
  return ctx;
}

export default TelemetryProvider;
