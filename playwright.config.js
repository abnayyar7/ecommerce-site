const { defineConfig } = require("@playwright/test");
require("dotenv").config({ quiet: true });

// Runs against a LOCAL production build (next build && next start), pointed at
// the shared Neon DB. All test data is *@example.invalid and purged by the
// global setup/teardown. Serial (workers:1) — write flows share one database.
module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: [["html", { open: "never" }], ["list"]],
  globalSetup: require.resolve("./tests/global-setup.js"),
  globalTeardown: require.resolve("./tests/global-teardown.js"),
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 20000,
    navigationTimeout: 60000,
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
