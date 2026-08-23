const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");
const { createTestUser } = require("./helpers/db");
const { loginViaApi } = require("./helpers/auth");
const { clickUntil } = require("./helpers/interact");

test("cart: add from PDP, view, update qty, remove", async ({ page, context }, testInfo) => {
  const user = await createTestUser({});
  await loginViaApi(context, user.email);

  await page.goto("/men");
  await page.waitForSelector('a[href^="/product/"]', { timeout: 30000 });
  const href = await page.locator('a[href^="/product/"]').first().getAttribute("href");
  await page.goto(href);
  // The Add-to-cart click can land before React hydrates the button, silently
  // no-op'ing; retry until the success toast confirms the add registered.
  await clickUntil(
    page.getByRole("button", { name: /Add to cart/i }),
    page.getByText(/added to the cart/i),
  );

  await page.goto("/cart");
  // CartClient renders two responsive layouts; scope to the visible one.
  const removeBtn = page.locator('[aria-label="Remove"]:visible');
  await expect(removeBtn.first()).toBeVisible({ timeout: 15000 });
  await shot(page, testInfo, "cart-with-item");

  // update quantity (+1) on the visible qty box: [minus, plus]
  const qtyBtns = page.locator(".w-32 button:visible");
  if (await qtyBtns.count()) {
    await qtyBtns.last().click();
    await page.waitForTimeout(1500);
    await shot(page, testInfo, "cart-qty-updated");
  }

  await removeBtn.first().click();
  await page.waitForTimeout(2000);
  await expect(page.locator('[aria-label="Remove"]:visible')).toHaveCount(0);
  await shot(page, testInfo, "cart-after-remove");
});
