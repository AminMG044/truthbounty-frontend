"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  detectPlatformSupport,
  type PlatformSupportResult,
} from "@/lib/platform-support";

export function PlatformSupportGuard({ children }: { children: ReactNode }) {
  const [support, setSupport] = useState<PlatformSupportResult | null>(null);

  useEffect(() => {
    setSupport(detectPlatformSupport());
  }, []);

  if (support?.supported) return children;

  if (!support) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        Checking browser support…
      </div>
    );
  }

  return (
    <section
      className="m-4 max-w-2xl rounded-md border border-warning bg-background p-6 text-foreground"
      role="alert"
      aria-labelledby="platform-support-title"
      aria-describedby="platform-support-description"
    >
      <h1 id="platform-support-title" className="text-lg font-semibold">
        Unsupported browser capabilities
      </h1>
      <p id="platform-support-description" className="mt-2 text-sm">
        This browser or WebView is missing required security or platform APIs.
        Update it or open TruthBounty in a supported browser. Wallet connection
        and network authorization are checked separately.
      </p>
      <ul className="mt-3 list-inside list-disc text-sm">
        {support.missingCapabilities.map((capability) => (
          <li key={capability}>{capability}</li>
        ))}
      </ul>
    </section>
  );
}