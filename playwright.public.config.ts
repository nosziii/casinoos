import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/public",
  workers: 1,
  retries: 1,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.PUBLIC_DEMO_URL ?? "https://casinoops.tech",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "public-chromium", use: { ...devices["Desktop Chrome"] } }],
});
