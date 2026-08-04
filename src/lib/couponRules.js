const MAGIC_FINAL_AMOUNT = 5000;
const MAGIC_UPPER_BOUND = 6000; // backend-only

// Flat ₹200 off. The minimum order value is the guard that keeps a flat
// discount from ever exceeding the cart — cheapest product in the catalog is
// ₹1,299, so this floor never blocks a real single-item cart.
const FLAT_200_DISCOUNT = 200;
const FLAT_200_MIN_ORDER = 1000;

export function applyCouponRule(ruleType, cartTotal) {
  switch (ruleType) {
    case "FLAT_200_OFF": {
      if (cartTotal < FLAT_200_MIN_ORDER) {
        return { valid: false, reason: "BELOW_MINIMUM" };
      }

      // Clamped so the discount can never exceed the cart, even if the
      // minimum above is lowered later.
      const discountAmount = Math.min(FLAT_200_DISCOUNT, cartTotal);

      return {
        valid: true,
        discountAmount,
        finalAmount: cartTotal - discountAmount,
      };
    }

    case "MAGIC_CLAMP_5000": {
      if (cartTotal <= MAGIC_FINAL_AMOUNT) {
        return { valid: false, reason: "NOT_APPLICABLE" };
      }

      if (cartTotal > MAGIC_UPPER_BOUND) {
        return { valid: false, reason: "EXCEEDS_LIMIT" };
      }

      return {
        valid: true,
        discountAmount: cartTotal - MAGIC_FINAL_AMOUNT,
        finalAmount: MAGIC_FINAL_AMOUNT,
      };
    }

    default:
      return { valid: false, reason: "UNKNOWN_RULE" };
  }
}
