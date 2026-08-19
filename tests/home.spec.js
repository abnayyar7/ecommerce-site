const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");

test("homepage: hero, categories, promo, newsletter", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Velaura/i);
  await expect(page.getByText(/Free Shipping on All Orders/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Shop by Category/i })).toBeVisible();
  await expect(page.getByText(/Join our Style Club/i)).toBeVisible();
  await shot(page, testInfo, "homepage");
});
