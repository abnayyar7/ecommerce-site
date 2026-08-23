const { test, expect } = require("@playwright/test");
const { shot } = require("./helpers/shot");
const { createTestUser, PASSWORD } = require("./helpers/db");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const sessionUser = async (context) =>
  (await (await context.request.get(`${BASE}/api/auth/session`)).json())?.user || null;

test("guest state: no session, checkout redirects to cart", async ({ page, context }, testInfo) => {
  expect(await sessionUser(context)).toBeNull();
  await page.goto("/");
  await shot(page, testInfo, "auth-guest-home");
  await page.goto("/checkout");
  await page.waitForTimeout(2500);
  await expect(page).toHaveURL(/\/cart/);
  await shot(page, testInfo, "auth-guest-checkout-redirect");
});

test("login via UI then logout", async ({ page, context }, testInfo) => {
  const user = await createTestUser({});
  await page.goto("/login");
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', PASSWORD);

  // The Sign in click can land before hydration and no-op; retry until the
  // session is established. Only click while the Sign in button is still shown —
  // once login registers and navigates away, just wait for the session to avoid
  // clicking a button that no longer exists.
  await expect(async () => {
    const signIn = page.getByRole("button", { name: /Sign in/i });
    if (await signIn.isVisible().catch(() => false)) await signIn.click();
    expect((await sessionUser(context))?.email).toBe(user.email);
  }).toPass({ timeout: 20000, intervals: [500, 1500, 3000] });
  await page.goto("/");
  await shot(page, testInfo, "auth-logged-in-home");

  // open the account menu: click on mobile (Profile button visible < md),
  // hover on desktop (group-hover reveals it), then click Logout.
  const profileBtn = page.locator('[aria-label="Profile"]');
  if (await profileBtn.isVisible().catch(() => false)) {
    await profileBtn.click();
  } else {
    await page.locator("div.relative.group").first().hover();
  }
  await page.getByText(/^Logout$/i).first().click({ timeout: 6000 });

  await expect.poll(async () => await sessionUser(context), { timeout: 20000 }).toBeNull();
  await shot(page, testInfo, "auth-after-logout");
});
