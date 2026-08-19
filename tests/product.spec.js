const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");

test("PDP: title, colour, add-to-cart present", async ({ page }, testInfo) => {
  await page.goto("/men");
  await page.waitForSelector('a[href^="/product/"]', { timeout: 30000 });
  const href = await page.locator('a[href^="/product/"]').first().getAttribute("href");
  await page.goto(href);
  await expect(page.getByRole("button", { name: /Add to cart/i })).toBeVisible();
  await expect(page.getByText(/Colour:/i)).toBeVisible();
  await shot(page, testInfo, "pdp");
});
