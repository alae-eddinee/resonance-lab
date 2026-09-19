import path from "node:path";
import { test, expect } from "@playwright/test";

const quietFile = path.join(__dirname, "fixtures", "quiet-96hz.wav");

test("a quiet, realistic-amplitude tone still activates a plate mode after processing", async ({ page }) => {
  await page.goto("/audio");
  await page.locator('input[type="file"]').setInputFiles(quietFile);
  await expect(page.getByText("quiet-96hz.wav")).toBeVisible();

  await page.getByText("Send selection to simulator").click();
  await expect(page).toHaveURL(/\/simulator/);
  await page.getByLabel("Source").selectOption("upload");
  await page.getByRole("button", { name: "Process" }).click();
  await expect(page.getByText("Processed result")).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: /^Play$/ }).click();
  await page.waitForTimeout(1000);

  const activeModesText = await page.getByText(/Active modes:/).innerText();
  const count = Number(activeModesText.replace(/[^0-9]/g, "") || "0");
  expect(count).toBeGreaterThan(0);
});
