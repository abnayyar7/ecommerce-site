const { expect } = require("@playwright/test");

// An SSR button can be clicked before React hydrates and wires its onClick, so a
// single click silently no-ops — no request, no state change, no error. Perform
// `action` (a locator to click, or a function for a fill+click), then wait for
// `confirm` to become visible as proof the handler actually ran; if it never
// appears the click didn't register, so retry.
//
// Safety for non-idempotent actions (wishlist toggles, coupon apply disables its
// input): before each attempt, if `confirm` is ALREADY visible we return without
// acting again, and `timeout` is generous so a slow-but-successful action is
// never mistaken for a no-op and repeated. Retry therefore fires only on a true
// pre-hydration no-op, where nothing happened and the control is still in its
// original state — making the repeat safe.
async function clickUntil(action, confirm, { tries = 4, timeout = 10000 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    if (await confirm.isVisible().catch(() => false)) return;
    if (typeof action === "function") await action();
    else await action.click();
    try {
      await expect(confirm).toBeVisible({ timeout });
      return;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

module.exports = { clickUntil };
