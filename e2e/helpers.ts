import type { BrowserContext, Page, Route } from "@playwright/test";
import { SignJWT } from "jose";
import { E2E_BACKEND_URL, E2E_SESSION_SECRET } from "./env";

/** Sign an admin session the same way app/lib/session.ts does. */
export async function signSession(secret = E2E_SESSION_SECRET): Promise<string> {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  return new SignJWT({ userId: "1", email: "admin@example.com", name: "Test Admin", expiresAt: expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(secret));
}

export async function signIn(context: BrowserContext, secret?: string) {
  await context.addCookies([
    { name: "session", value: await signSession(secret), domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
}

/**
 * Mock browser calls to the FastAPI backend. Keys are paths ("/leads/");
 * anything not listed fails with 404 so a missing mock is obvious.
 */
export async function mockBackend(page: Page, responses: Record<string, unknown>) {
  await page.route(`${E2E_BACKEND_URL}/**`, (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname in responses) {
      return route.fulfill({ json: responses[pathname] });
    }
    return route.fulfill({ status: 404, json: { detail: "not mocked" } });
  });
}

/** The page's own alert; Next.js also renders an empty role="alert" route announcer. */
export const pageAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
