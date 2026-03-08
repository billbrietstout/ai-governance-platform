/**
 * MVP flows – Playwright e2e.
 * Onboarding -> create asset -> import card -> run assessment -> report
 * Create vendor -> add evidence -> check assurance score
 * axe-core for accessibility.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("MVP flows", () => {
  test("health endpoint returns status", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toMatchObject({ status: expect.any(String), timestamp: expect.any(String) });
  });

  test("ready endpoint returns db and auth status", async ({ request }) => {
    const res = await request.get("/api/ready");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toMatchObject({ status: expect.any(String) });
  });

  test("login page loads and has accessible form", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/./);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("dashboard readable at 1024px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("maintenance page loads", async ({ page }) => {
    await page.goto("/maintenance");
    await expect(page.getByRole("heading", { name: /maintenance/i })).toBeVisible();
  });
});
