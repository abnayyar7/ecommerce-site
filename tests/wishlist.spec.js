const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");
const { createTestUser } = require("./helpers/db");
const { loginViaApi } = require("./helpers/auth");
const { clickUntil } = require("./helpers/interact");

test("wishlist: add from PDP, view, remove", async ({ page, context }, testInfo) => {
  const user = await createTestUser({});
  await loginViaApi(context, user.email);

  await page.goto("/men");
  await page.waitForSelector('a[href^="/product/"]', { timeout: 30000 });
  const href = await page.locator('a[href^="/product/"]').first().getAttribute("href");
  await page.goto(href);

  // The click can land before hydration and no-op; retry until the button
  // toggles to REMOVE FROM WISHLIST, which confirms the add registered.
  await clickUntil(
    page.getByText(/ADD TO WISHLIST/i),
    page.getByText(/REMOVE FROM WISHLIST/i),
  );
  await shot(page, testInfo, "wishlist-added-on-pdp");

  await page.goto("/wishlist");
  // WishlistItem renders a remove control (no product <a href>) per item
  const remove = page.locator('[aria-label="Remove from wishlist"]');
  await expect(remove.first()).toBeVisible({ timeout: 15000 });
  await shot(page, testInfo, "wishlist-page");

  await remove.first().click();
  await page.waitForTimeout(2000);
  await shot(page, testInfo, "wishlist-after-remove");
});
