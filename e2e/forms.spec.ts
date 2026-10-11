import { expect, test, type Page } from "@playwright/test";
import { pageAlert } from "./helpers";

// The forms post to the Next.js API routes; those are mocked here so the
// tests cover the browser side: validation, payload, and success/error UI.

async function fillDemoRequest(page: Page) {
  await page.getByLabel("Company Name").fill("Acme Corp");
  await page.getByLabel("Contact Person").fill("Pat Jones");
  await page.getByLabel("Email").fill("pat@acme.example");
  await page.getByLabel("Phone").fill("555-0100");
  await page.getByLabel("Budget Range").selectOption("$10,000 - $50,000");
  await page.getByLabel("Cybersecurity Shield").check();
  await page.getByLabel(/Message/).fill("We need an audit before Q1.");
}

test.describe("demo request form", () => {
  test("shows a field error for every missing field and sends nothing", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/leads/submit-rfd", (route) => {
      requests++;
      return route.fulfill({ json: {} });
    });
    await page.goto("/rfd");
    await page.getByRole("button", { name: "Submit Demo Request" }).click();

    for (const field of ["company", "contactPerson", "email", "phone", "budget", "products"]) {
      await expect(page.locator(`#${field}-error`)).toBeVisible();
    }
    await expect(page.getByLabel("Company Name")).toHaveAttribute("aria-invalid", "true");
    expect(requests).toBe(0);

    // Fixing a field clears its error
    await page.getByLabel("Company Name").fill("Acme Corp");
    await expect(page.locator("#company-error")).toBeHidden();
  });

  test("rejects an invalid email", async ({ page }) => {
    await page.goto("/rfd");
    await fillDemoRequest(page);
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Submit Demo Request" }).click();
    await expect(page.locator("#email-error")).toBeVisible();
  });

  test("submits the right payload and confirms", async ({ page, context }) => {
    let payload: Record<string, unknown> | undefined;
    await page.route("**/api/leads/submit-rfd", async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { success: true, message: "Thanks! We will be in touch within one business day.", lead_id: 1 } });
    });
    await page.goto("/rfd");
    await fillDemoRequest(page);
    await page.getByRole("button", { name: "Submit Demo Request" }).click();

    await expect(page.getByRole("status")).toHaveText("Thanks! We will be in touch within one business day.");
    const visitor = (await context.cookies()).find((c) => c.name === "visitor_session_id")?.value;
    expect(payload).toEqual({
      company: "Acme Corp",
      contactPerson: "Pat Jones",
      email: "pat@acme.example",
      phone: "555-0100",
      budget: "$10,000 - $50,000",
      products: ["Cybersecurity Shield"],
      message: "We need an audit before Q1.",
      session_id: visitor,
      website: "",
    });
    await expect(page.getByLabel("Company Name")).toHaveValue("");
  });

  test("keeps the visitor's input and shows a friendly error when submission fails", async ({ page }) => {
    await page.route("**/api/leads/submit-rfd", (route) =>
      route.fulfill({ status: 500, json: { detail: "Error processing RFD submission" } }),
    );
    await page.goto("/rfd");
    await fillDemoRequest(page);
    await page.getByRole("button", { name: "Submit Demo Request" }).click();

    const alert = pageAlert(page);
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText("RFD submission"); // no backend detail leaks
    await expect(page.getByLabel("Company Name")).toHaveValue("Acme Corp");
  });
});

test.describe("contact form", () => {
  test("validates, then submits and confirms", async ({ page }) => {
    let payload: Record<string, unknown> | undefined;
    await page.route("**/api/contact/submit", async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { success: true, message: "Message received. We will reply within one business day." } });
    });
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send Message" }).click();
    for (const field of ["name", "email", "subject", "message"]) {
      await expect(page.locator(`#${field}-error`)).toBeVisible();
    }
    expect(payload).toBeUndefined();

    await page.locator("#name").fill("Sam Lee");
    await page.getByLabel("Email").fill("sam@example.com");
    await page.getByLabel("Company Name").fill("Globex");
    await page.getByLabel("Phone").fill("555-0101");
    await page.getByLabel("Budget Range").selectOption("$25,000+");
    await page.getByLabel("Subject").fill("Pricing question");
    await page.getByLabel(/^Message/).fill("Do you offer annual billing?");
    await page.getByRole("button", { name: "Send Message" }).click();

    await expect(page.getByRole("status")).toHaveText("Message received. We will reply within one business day.");
    expect(payload).toMatchObject({ name: "Sam Lee", subject: "Pricing question", budget: "$25,000+", website: "" });
  });
});
