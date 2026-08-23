const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");
const { createTestUser } = require("./helpers/db");
const { loginViaApi } = require("./helpers/auth");
const { clickUntil } = require("./helpers/interact");

// WELCOME2026: flat Rs200 off, min order Rs1000, oncePerCustomer. Applying at
// the cart step does not consume it (only order creation records usage), so a
// fresh test user can apply + remove freely.
test("coupon: WELCOME2026 apply shows discount, remove clears it", async ({ page, context }, testInfo) => {
  const user = await createTestUser({ cartItems: 1 }); // 1 item >= Rs1299 >= min
  await loginViaApi(context, user.email);

  await page.goto("/cart");
  // Pre-hydration the fill can be reset and the Apply click can no-op; re-fill
  // and re-click until the applied confirmation appears.
  await clickUntil(async () => {
    await page.getByPlaceholder(/Enter coupon code/i).fill("WELCOME2026");
    await page.getByRole("button", { name: /^Apply$/i }).click();
  }, page.getByText(/Coupon WELCOME2026 applied/i));
  await expect(page.getByText(/Coupon \(WELCOME2026\)/i)).toBeVisible();
  await shot(page, testInfo, "coupon-applied");

  await page.locator("button.text-red-600").click(); // coupon Remove (not the cart-item remove icon)
  await expect(page.getByText(/Coupon WELCOME2026 applied/i)).toHaveCount(0, { timeout: 10000 });
  await shot(page, testInfo, "coupon-removed");
});
