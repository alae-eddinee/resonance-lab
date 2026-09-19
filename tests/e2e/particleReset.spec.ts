import { test, expect } from "@playwright/test";

test("Reset particles control is available in the particles view", async ({ page }) => {
  await page.goto("/simulator");
  const viewSelect = page.getByLabel("View", { exact: true });
  await expect(viewSelect).toHaveValue("particles");
  await expect(page.getByRole("button", { name: "Reset particles" })).toBeVisible();

  await viewSelect.selectOption("displacement");
  await expect(page.getByRole("button", { name: "Reset particles" })).toHaveCount(0);

  await viewSelect.selectOption("particles");
  await expect(page.getByRole("button", { name: "Reset particles" })).toBeVisible();
  await page.getByRole("button", { name: "Reset particles" }).click();
});
