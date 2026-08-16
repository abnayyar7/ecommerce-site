export const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone) => {
  if (!phone) return false;
  return /^[0-9]{10}$/.test(phone);
};

export const validateFullName = (name) => {
  if (!name) return false;
  return name.trim().length >= 2;
};

/**
 * Shipping is free on every order, with no minimum — matching the homepage
 * banner and the Shipping & Delivery Policy.
 *
 * This previously charged ₹75 (Delhi) / ₹100 below a ₹500 subtotal. That
 * branch was unreachable — the cheapest product is ₹1,299, so no cart could
 * fall under the threshold — while the policy page advertised a different
 * ₹999 threshold and tiers the code never applied.
 *
 * The signature is kept so reintroducing charges stays a single-function
 * change; both call sites already pass state and subtotal.
 */
export function shippingCharges(_state, _subtotal) {
  return 0;
}

