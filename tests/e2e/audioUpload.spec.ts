import path from "node:path";
import { test, expect } from "@playwright/test";

const sampleFile = path.join(__dirname, "..", "..", "public", "samples", "tone-440hz.wav");

test.describe("Audio upload and saving", () => {
  test("uploading a 440 Hz sample shows analysis and allows saving an experiment", async ({ page }) => {
    await page.goto("/audio");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleFile);

    await expect(page.getByText("tone-440hz.wav")).toBeVisible();
    await expect(page.getByText(/44100 Hz/)).toBeVisible();
    await expect(page.getByText("Send selection to simulator")).toBeVisible();
  });

  test("importing an invalid JSON file shows a clear error", async ({ page }) => {
    await page.goto("/experiments");
    const fileInput = page.locator('input[type="file"][accept="application/json"]');
    const buffer = Buffer.from(JSON.stringify({ not: "a valid experiment" }));
    await fileInput.setInputFiles({ name: "bad.json", mimeType: "application/json", buffer });
    await expect(page.getByText(/Invalid experiment file/i)).toBeVisible();
  });
});
