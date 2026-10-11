import { expect, test } from "@playwright/test";
import { mockBackend, pageAlert, signIn } from "./helpers";

test("the dashboard requires a session", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL("/admin/login");
  await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
});

test("a session signed with the wrong secret is rejected and cleared", async ({ page, context }) => {
  await signIn(context, "a-different-secret-that-is-long-enough-to-pass");
  await page.goto("/admin/leads");
  await expect(page).toHaveURL("/admin/login?expired=1");
  await expect(page.getByRole("status")).toContainText("session expired");
  expect((await context.cookies()).find((c) => c.name === "session")).toBeUndefined();
});

test("sign-in reports an unreachable backend instead of hanging", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("not-a-real-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(pageAlert(page)).toHaveText("Unable to connect to the server. Please try again.");
  await expect(page).toHaveURL("/admin/login");
});

test("dashboard shows metrics and the hottest leads, ranked", async ({ page, context }) => {
  await signIn(context);
  await mockBackend(page, {
    "/analytics/dashboard": {
      total_leads: 42,
      new_leads_this_week: 7,
      total_rfd_submissions: 18,
      total_contact_messages: 5,
      conversion_rate: 0.25,
      leads_by_source: [{ source: "RFD Form", count: 30 }, { source: "contact-form", count: 12 }],
      most_viewed_product: { product_id: 2, name: "Cybersecurity Shield", view_count: 120 },
      completion_rates_by_product: [{ product_id: 2, name: "Cybersecurity Shield", starts: 10, completes: 7, completion_rate: 0.7 }],
    },
    "/leads/scores": [
      { lead_id: 3, name: "Riley Chen", company: "Initech", status: "new", label: "hot", points: 78 },
      { lead_id: 9, name: "Sam Lee", company: "Globex", status: "contacted", label: "warm", points: 41 },
      { lead_id: 4, name: "Cold Lead", company: null, status: "new", label: "cold", points: 0 },
    ],
    "/leads/": [],
    "/leads/contact-messages": [],
  });

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("42", { exact: true })).toBeVisible();
  await expect(page.getByText("25%", { exact: true })).toBeVisible();
  await expect(page.getByText("Cybersecurity Shield").first()).toBeVisible();

  // Leads with no engagement are left out; the rest keep the API's ranking
  const hottest = page
    .getByRole("heading", { name: "Hottest leads" })
    .locator("xpath=ancestor::*[.//ol][1]")
    .locator("ol > li");
  await expect(hottest).toHaveCount(2);
  await expect(hottest.nth(0)).toContainText("Riley Chen");
  await expect(hottest.nth(1)).toContainText("Sam Lee");
  await expect(page.getByRole("link", { name: "View Riley Chen" })).toHaveAttribute("href", "/admin/leads/3");
});

test("dashboard shows an error when analytics fail", async ({ page, context }) => {
  await signIn(context);
  await mockBackend(page, { "/leads/scores": [], "/leads/": [], "/leads/contact-messages": [] });
  await page.goto("/admin");
  await expect(page.getByText("Failed to load analytics metrics")).toBeVisible();
  await expect(page.getByText("No engaged leads yet.")).toBeVisible();
});
