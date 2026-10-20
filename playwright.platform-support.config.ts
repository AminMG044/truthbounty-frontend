import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "platform-support.spec.ts",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-webview", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm start",
    port: 3000,
    reuseExistingServer: true,
    timeout: 60000,
    env: { E2E_HARNESS: "1" },
  },
});