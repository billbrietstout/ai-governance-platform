/**
 * E2E smoke test – placeholder for enterprise AI governance platform.
 */
import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/./);
});
