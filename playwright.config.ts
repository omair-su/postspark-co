import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression config for the landing page.
 * Run locally with:  bun run test:visual
 * Update baselines:   bun run test:visual:update
 */
export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/__snapshots__",
  fullyParallel: true,
  reporter: [["list"]],
  expect: {
    // Allow tiny anti-aliasing diffs but flag real layout shifts.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080",
    colorScheme: "light",
    reducedMotion: "reduce",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "bun run dev",
        url: "http://localhost:8080",
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    { name: "mobile-375", use: { ...devices["iPhone SE"], viewport: { width: 375, height: 800 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 900 } } },
    { name: "wide-1536", use: { viewport: { width: 1536, height: 960 } } },
  ],
});
