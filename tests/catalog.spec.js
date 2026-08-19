const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");

const categories = [
  { path: "/men", label: "men", title: /Men/i },
  { path: "/accessories", label: "accessories", title: /Accessories/i },
  { path: "/footwear", label: "footwear", title: /Footwear/i }, // virtual category
];

for (const c of categories) {
  test(`catalog ${c.label}: lists products`, async ({ page }, testInfo) => {
    await page.goto(c.path);
    await expect(page).toHaveTitle(c.title);
    await page.waitForSelector('a[href^="/product/"]', { timeout: 30000 });
    const count = await page.locator('a[href^="/product/"]').count();
    expect(count).toBeGreaterThan(0);
    await shot(page, testInfo, `catalog-${c.label}`);
  });
}
