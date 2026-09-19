import { test, expect } from "@playwright/test";

test.describe("Landing page and navigation", () => {
  test("home page renders headline and primary actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("See how sound frequencies");
    await expect(page.getByRole("link", { name: "Start microphone session" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Upload audio" })).toBeVisible();
  });

  test("navigating to Live Cymatics does not request microphone permission automatically", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start microphone session" }).click();
    await expect(page).toHaveURL(/\/live$/);
    await expect(page.getByRole("heading", { name: "Live Cymatics" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start microphone/ })).toBeVisible();
  });

  test("all main routes are reachable and return a unique h1", async ({ page }) => {
    const routes = [
      "/live",
      "/audio",
      "/simulator",
      "/physical",
      "/compare",
      "/experiments",
      "/learn",
      "/hardware",
      "/methodology",
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
    }
  });

  test("unknown route shows a labeled not-found page", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
