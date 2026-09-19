import { test, expect, type BrowserContext } from "@playwright/test";

test.describe("Microphone permission handling", () => {
  test("denied permission shows a clear message and does not crash the page", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "getUserMedia mocking is set up for Chromium only");
    await mockGetUserMediaDenied(context);
    await page.goto("/live");
    await page.getByRole("button", { name: "Start microphone" }).click();
    await expect(page.getByText(/Microphone permission denied/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Start microphone" })).toBeVisible();
  });
});

async function mockGetUserMediaDenied(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: {
        ...window.navigator.mediaDevices,
        getUserMedia: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
      },
    });
  });
}
