import path from "node:path";
import { test, expect } from "@playwright/test";

const low = path.join(__dirname, "fixtures", "tone-150hz-quiet.wav");
const high = path.join(__dirname, "fixtures", "tone-700hz-quiet.wav");

async function processAndGetResonanceRows(page: import("@playwright/test").Page, file: string) {
  await page.goto("/audio");
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByText("Send selection to simulator")).toBeVisible();
  await page.getByText("Send selection to simulator").click();
  await expect(page).toHaveURL(/\/simulator/);
  await page.getByLabel("Source").selectOption("upload");
  await page.getByRole("button", { name: "Process" }).click();
  await expect(page.getByText("Processed result")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /^Play$/ }).click();
  await page.waitForTimeout(1200);
  return page.locator("table").last().innerText();
}

test("clearly different input frequencies drive clearly different plate patterns", async ({ page }) => {
  const lowResult = await processAndGetResonanceRows(page, low);
  const highResult = await processAndGetResonanceRows(page, high);
  expect(lowResult).not.toBe(highResult);
});
