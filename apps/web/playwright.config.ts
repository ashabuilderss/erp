import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.WEB_E2E_BASE_URL ?? "http://127.0.0.1:3000";
const startWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1";
const browserChannel = process.env.WEB_E2E_BROWSER_CHANNEL;
const baseURLPort = new URL(baseURL).port || "3000";
const serverMode = process.env.WEB_E2E_SERVER_MODE ?? "dev";
const defaultWebServerCommand =
  serverMode === "production" || serverMode === "start"
    ? `npm run start -- --port ${baseURLPort}`
    : `npm run dev -- --port ${baseURLPort}`;
const webServerCommand =
  process.env.WEB_E2E_WEB_SERVER_COMMAND ?? defaultWebServerCommand;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter:
    process.env.PLAYWRIGHT_HTML_REPORT === "1"
      ? [
          ["list"],
          ["html", { open: "never", outputFolder: "playwright-report" }],
        ]
      : [["list"]],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.WEB_E2E_VIDEO === "1" ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(browserChannel ? { channel: browserChannel } : {}),
      },
    },
  ],
  ...(startWebServer
    ? {
        webServer: {
          command: webServerCommand,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            API_URL: process.env.API_URL ?? "http://127.0.0.1:4000",
            AUTH_SECRET:
              process.env.AUTH_SECRET ??
              process.env.WEB_E2E_AUTH_SECRET ??
              "local-playwright-auth-secret-change-me",
            NEXTAUTH_URL: baseURL,
            AUTH_URL: process.env.AUTH_URL ?? baseURL,
          },
        },
      }
    : {}),
});
