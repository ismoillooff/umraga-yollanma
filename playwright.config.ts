import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5181", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        channel: "chrome",
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        channel: "chrome",
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5181 --strictPort",
    url: "http://127.0.0.1:5181",
    reuseExistingServer: false,
    env: {
      UMRA_API_PORT: "5183",
      UMRA_DB_PATH: `.local/e2e-${Date.now()}.sqlite3`,
      UMRA_ADMIN_USERNAME: "test-admin",
      UMRA_ADMIN_PASSWORD: "test-only-umra-password-2026",
    },
  },
});
