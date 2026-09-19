import { test, expect } from "@playwright/test";

test.describe("Plate Simulator", () => {
  test("changing shape and thickness updates the resonance table", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.getByRole("heading", { name: "Plate Simulator" })).toBeVisible();

    const resonanceTable = page.getByRole("heading", { name: "Resonance table" }).locator("..");
    await expect(resonanceTable.locator("tbody tr").first()).toBeVisible();
    const firstFrequencyText = await resonanceTable.locator("tbody tr").first().locator("td").nth(1).innerText();

    await page.getByRole("button", { name: "Advanced" }).click();
    await page.getByLabel("Shape").selectOption("circle");
    await expect(page.getByLabel("Radius numeric value")).toBeVisible();

    await page.getByLabel("Shape").selectOption("square");
    const thicknessInput = page.getByLabel("Thickness numeric value");
    await thicknessInput.fill("3");
    await thicknessInput.blur();

    await expect
      .poll(async () => resonanceTable.locator("tbody tr").first().locator("td").nth(1).innerText())
      .not.toBe(firstFrequencyText);
  });

  test("switching to Advanced mode reveals material properties", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.getByText("Material properties")).toHaveCount(0);
    await page.getByRole("button", { name: "Advanced" }).click();
    await expect(page.getByText("Material properties")).toBeVisible();
  });
});
