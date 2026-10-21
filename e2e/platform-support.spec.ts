import { expect, test } from "@playwright/test";

test("supported browser APIs release the application shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("alert", { name: /unsupported browser/i })).toHaveCount(0);
  await expect(page.getByRole("main")).toBeVisible();
});

test("missing browser API blocks the application shell before interaction", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");

  const alert = page.getByRole("alert", { name: /unsupported browser capabilities/i });
  await expect(alert).toContainText("fetch");
  await expect(page.getByRole("main")).toHaveCount(0);
});

test("wallet extension absence does not grant a wallet session", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "ethereum", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");

  await expect(page.getByRole("alert", { name: /unsupported browser/i })).toHaveCount(0);
  await expect(page.getByRole("main")).toBeVisible();
});