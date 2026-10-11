import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/", heading: /.+/ },
  { path: "/products", heading: /solutions/i },
  { path: "/features", heading: /.+/ },
  { path: "/pricing", heading: /.+/ },
  { path: "/about", heading: /.+/ },
  { path: "/contact", heading: "Contact us" },
  { path: "/rfd", heading: "Request a demo" },
  { path: "/privacy", heading: /privacy/i },
  { path: "/terms", heading: /terms/i },
];

for (const { path, heading } of PAGES) {
  test(`${path} renders with one h1 and security headers`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Nexus IT Solutions/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(heading);

    const headers = response!.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });
}

test("unknown pages return 404", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
});

test("main navigation reaches every section and marks the current page", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const [label, path] of [["Features", "/features"], ["Pricing", "/pricing"], ["About", "/about"], ["Contact", "/contact"]]) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  }
  await page.getByRole("banner").getByRole("link", { name: "Request a demo" }).click();
  await expect(page).toHaveURL("/rfd");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("menu opens and closes, and no page scrolls sideways", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    await expect(page.locator("#mobile-nav")).toBeVisible();
    await page.locator("#mobile-nav").getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL("/pricing");
    await expect(page.locator("#mobile-nav")).toBeHidden();

    for (const path of ["/", "/pricing", "/rfd", "/contact"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(0);
    }
  });
});

test("visitors get an anonymous tracking id cookie", async ({ page, context }) => {
  await page.goto("/");
  const cookie = (await context.cookies()).find((c) => c.name === "visitor_session_id");
  expect(cookie?.value).toMatch(/^[0-9a-f-]{36}$/);
});
