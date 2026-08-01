import { expect, test } from "@playwright/test";

test.describe("PWA installability", () => {
  test("the homepage links a valid manifest", async ({ page, request }) => {
    await page.goto("/");

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestHref).toBe("/manifest.json");

    const response = await request.get(manifestHref!);
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
