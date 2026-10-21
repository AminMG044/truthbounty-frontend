# Supported Browser and Wallet Platforms

This policy applies to the approved frontend screens and is independent of protocol, account, session, role, release, or network authorization. A supported browser never grants a wallet capability.

## Minimum Support Window

| Platform | Minimum supported version | Runtime behavior |
|---|---|---|
| Desktop Chrome / Chromium | Current and previous stable release | Supported when required secure-context APIs are present. |
| Desktop Firefox | Current and previous stable release | Supported when required secure-context APIs are present. |
| Desktop Safari / WebKit | Current and previous stable release | Supported when required secure-context APIs are present. |
| Mobile browser / WebView | Current and previous major OS-provided browser or WebView release | Supported when required secure-context APIs are present; embedded WebViews may not expose wallet transports. |
| Wallet extension | Current and previous stable extension release on a supported desktop browser | Optional transport; its absence does not mark the browser unsupported and does not create a connection. |
| WalletConnect | WalletConnect v2-compatible wallet on a supported browser or mobile WebView | Optional transport; an absent connector/configuration remains unavailable and cannot authorize an action. |

The rolling release window avoids claiming compatibility with obsolete engines. Browser names and versions are policy labels only: the runtime gate does not inspect user-agent strings. It requires a secure context, `BigInt`, `AbortController`, `fetch`, `TextEncoder`, Web Crypto `subtle`, and secure random values. Missing requirements block the application shell before mutation-capable children mount, with an accessible explanation.

## Independent Authorization Boundary

Browser capability, connector availability, wallet connection, session validity, supported chain, release freshness, and protocol capability are separate checks. Extension or WalletConnect availability is never inferred from browser identity. Missing connectors, denied requests, stale state, wrong chain/release, and unavailable authority remain non-authorizing and fail closed. Contract receipts and reviewed API projections remain the only sources of protocol state.

## CI Smoke Matrix

`pnpm exec playwright test --config playwright.platform-support.config.ts` runs the platform boundary against Playwright projects `chromium`, `firefox`, `webkit`, and `mobile-webview` (Pixel 7 emulation). It checks normal API support, forced missing-API behavior, and an absent injected extension. Unit tests cover secure-context and missing-API detection. Playwright project names and this table must be updated together when the support policy changes.

Touch interaction is exercised by the mobile project; the unsupported state has no mutation controls, and all status/error content is exposed through semantic live-region roles. Wallet controls retain native keyboard operation through the existing wallet boundary.