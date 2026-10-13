/**
 * Minimal ambient type declarations for jest-axe (v10 ships no bundled types)
 * and the `toHaveNoViolations` matcher registered by `jest-axe/extend-expect`.
 */

declare module 'jest-axe' {
  export interface AxeResults {
    violations: AxeViolation[];
    passes: unknown[];
    incomplete: unknown[];
    inapplicable: unknown[];
    [key: string]: unknown;
  }

  export interface AxeViolation {
    id: string;
    impact?: string;
    help: string;
    helpUrl?: string;
    nodes: unknown[];
    [key: string]: unknown;
  }

  export function configureAxe(options?: Record<string, unknown>): (
    element: Element,
  ) => Promise<AxeResults>;

  export function axe(
    element: Element,
    options?: Record<string, unknown>,
  ): Promise<AxeResults>;

  export const toHaveNoViolations: {
    toHaveNoViolations(received: AxeResults): {
      pass: boolean;
      message(): string;
    };
  };
}

declare module 'jest-axe/extend-expect' {
  // Side-effect only: registers the toHaveNoViolations matcher.
  export {};
}

declare module '@jest/expect' {
  interface Matchers<R> {
    toHaveNoViolations(): R;
  }
}
