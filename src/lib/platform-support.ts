export const PLATFORM_SUPPORT_POLICY = {
  desktop: "Current and previous stable release",
  mobileWebView: "Current and previous major OS/WebView release",
  walletExtension: "Current and previous stable release on supported desktop browsers",
  walletConnect: "WalletConnect v2 connector on supported browsers and mobile WebViews",
} as const;

export type PlatformCapability =
  | "secure context"
  | "BigInt"
  | "AbortController"
  | "fetch"
  | "TextEncoder"
  | "Web Crypto (subtle)"
  | "Web Crypto (secure randomness)";

export interface PlatformSupportResult {
  readonly supported: boolean;
  readonly missingCapabilities: readonly PlatformCapability[];
}

export interface PlatformRuntime {
  readonly isSecureContext?: boolean;
  readonly BigInt?: unknown;
  readonly AbortController?: unknown;
  readonly fetch?: unknown;
  readonly TextEncoder?: unknown;
  readonly crypto?: {
    readonly subtle?: unknown;
    readonly getRandomValues?: unknown;
  };
}

export function detectPlatformSupport(
  runtime: PlatformRuntime = globalThis,
): PlatformSupportResult {
  const missingCapabilities: PlatformCapability[] = [];

  if (runtime.isSecureContext !== true) {
    missingCapabilities.push("secure context");
  }
  if (typeof runtime.BigInt !== "function") {
    missingCapabilities.push("BigInt");
  }
  if (typeof runtime.AbortController !== "function") {
    missingCapabilities.push("AbortController");
  }
  if (typeof runtime.fetch !== "function") {
    missingCapabilities.push("fetch");
  }
  if (typeof runtime.TextEncoder !== "function") {
    missingCapabilities.push("TextEncoder");
  }
  if (typeof runtime.crypto?.subtle !== "object") {
    missingCapabilities.push("Web Crypto (subtle)");
  }
  if (typeof runtime.crypto?.getRandomValues !== "function") {
    missingCapabilities.push("Web Crypto (secure randomness)");
  }

  return {
    supported: missingCapabilities.length === 0,
    missingCapabilities,
  };
}