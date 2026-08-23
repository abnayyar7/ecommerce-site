const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");
const { createTestUser } = require("./helpers/db");
const { loginViaApi } = require("./helpers/auth");
const { clickUntil } = require("./helpers/interact");

async function fillContact(page) {
  // Pre-hydration the fills can reset and the Proceed click can no-op; re-fill
  // and re-click until the address step (address1 input) appears.
  await clickUntil(async () => {
    await page.fill('input[name="fullName"]', "PW Test");
    await page.fill('input[name="email"]', "pw@example.invalid");
    await page.fill('input[name="phone"]', "9876543210");
    await page.getByRole("button", { name: /Proceed/i }).click();
  }, page.locator('input[name="address1"]'), { timeout: 4000 });
}

async function selectState(page, name) {
  await page.locator("div.cursor-pointer").filter({ hasText: "State" }).first().click();
  await page.waitForTimeout(400);
  await page.getByText(name, { exact: true }).click();
  await page.waitForTimeout(300);
}

async function placeCod(page, testInfo, tag) {
  await expect(page.getByRole("button", { name: /Place COD Order/i })).toBeVisible({ timeout: 20000 });
  await shot(page, testInfo, `checkout-${tag}-payment`);
  await page.getByRole("button", { name: /Place COD Order/i }).click();
  await page.waitForURL(/order-confirmation/, { timeout: 40000 });
  await page.waitForTimeout(3000);
  await expect(page.getByText(/Order Received|Order Placed/i).first()).toBeVisible({ timeout: 20000 });
  await shot(page, testInfo, `checkout-${tag}-confirmation`);
}

test("checkout: 0 saved addresses -> COD -> confirmation", async ({ page, context }, testInfo) => {
  const user = await createTestUser({ cartItems: 1 });
  await loginViaApi(context, user.email);

  await page.goto("/checkout");
  await fillContact(page);
  await shot(page, testInfo, "checkout-0addr-address-step");

  // no saved-address selector in the 0-address case
  await expect(page.locator('input[name="savedAddress"]')).toHaveCount(0);
  await expect(page.getByText(/Save this address/i)).toBeVisible();

  await page.fill('input[name="address1"]', "12 Example Street");
  await page.fill('input[name="city"]', "Mumbai");
  await page.fill('input[name="pincode"]', "400050");
  await selectState(page, "Maharashtra");
  await page.getByRole("button", { name: /Save & Continue|Update Address/i }).click();
  await page.waitForTimeout(8000); // order-create transaction

  await placeCod(page, testInfo, "0addr");
});

test("checkout: >=1 saved address -> default prefilled -> COD -> confirmation", async ({ page, context }, testInfo) => {
  const user = await createTestUser({
    cartItems: 1,
    addresses: [
      { address1: "OTHER-14 Side Rd", city: "Pune", state: "Maharashtra", pincode: "411001", label: "WORK", isDefault: false },
      { address1: "DEFAULT-99 Main Ave", city: "Mumbai", state: "Maharashtra", pincode: "400050", label: "HOME", isDefault: true },
    ],
  });
  await loginViaApi(context, user.email);

  await page.goto("/checkout");
  await fillContact(page);
  await page.waitForTimeout(1500);

  // selector present, default auto-selected + prefilled
  await expect(page.locator('input[name="savedAddress"]')).toHaveCount(2);
  await expect(page.locator('input[name="address1"]')).toHaveValue(/DEFAULT-99 Main Ave/);
  await expect(page.getByText(/Save as default/i)).toBeVisible();
  await shot(page, testInfo, "checkout-savedaddr-selector");

  await page.getByRole("button", { name: /Save & Continue|Update Address/i }).click();
  await page.waitForTimeout(8000);

  await placeCod(page, testInfo, "savedaddr");
});
