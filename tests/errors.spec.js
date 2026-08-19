const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");

test("real 404: unknown route returns 404", async ({ page }, testInfo) => {
  const res = await page.goto("/product/definitely-not-a-real-product-xyz");
  expect(res.status()).toBe(404);
  await shot(page, testInfo, "error-404-real");
});

// Known parked debt: /nope-category is a SOFT 404 — returns 200 with an empty
// listing and noindex, rather than a real 404. Captured, not fixed.
test("soft-404: /nope-category returns 200 (known debt)", async ({ page }, testInfo) => {
  const res = await page.goto("/nope-category");
  expect(res.status()).toBe(200);
  await shot(page, testInfo, "error-404-soft-nope-category");
});
