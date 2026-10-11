import { defineConfig, devices } from "@playwright/test";
import { E2E_BACKEND_URL, E2E_SESSION_SECRET } from "./e2e/env";

const PORT = 3100;

// End-to-end tests run against a production build. The backend URL points at
// a port nothing listens on, and every browser call to it is mocked per test,
// so the suite never touches a real database.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_BACKEND_API_URL: E2E_BACKEND_URL,
      SESSION_SECRET: E2E_SESSION_SECRET,
      FORCE_HTTPS: "false",
    },
  },
});
