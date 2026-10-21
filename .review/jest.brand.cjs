const nextJest = require("next/jest");
module.exports = nextJest({ dir: "./" })({
  rootDir: "..",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["<rootDir>/src/__tests__/design-system/brand-assets.test.tsx", "<rootDir>/src/__tests__/design-system/semantic-tokens.test.ts"],
});
