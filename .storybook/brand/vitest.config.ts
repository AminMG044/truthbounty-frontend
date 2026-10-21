import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [storybookTest({ configDir: dirname })],
  test: {
    name: "brand",
    browser: { enabled: true, headless: true, provider: playwright({}), instances: [{ browser: "chromium" }] },
  },
});
