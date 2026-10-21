import { detectPlatformSupport } from "@/lib/platform-support";

const supportedRuntime = {
  isSecureContext: true,
  BigInt,
  AbortController,
  fetch,
  TextEncoder,
  crypto: {
    subtle: {},
    getRandomValues: () => undefined,
  },
};

describe("detectPlatformSupport", () => {
  it("accepts the required secure browser capabilities", () => {
    expect(detectPlatformSupport(supportedRuntime)).toEqual({
      supported: true,
      missingCapabilities: [],
    });
  });

  it("fails closed and names missing APIs", () => {
    const result = detectPlatformSupport({
      ...supportedRuntime,
      fetch: undefined,
      crypto: { ...supportedRuntime.crypto, subtle: undefined },
    });

    expect(result.supported).toBe(false);
    expect(result.missingCapabilities).toEqual([
      "fetch",
      "Web Crypto (subtle)",
    ]);
  });

  it("requires a secure context independently of API availability", () => {
    const result = detectPlatformSupport({
      ...supportedRuntime,
      isSecureContext: false,
    });

    expect(result.supported).toBe(false);
    expect(result.missingCapabilities).toContain("secure context");
  });
});