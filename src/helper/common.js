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

export function shippingCharges(state, subtotal) {
  // Free shipping for 500 or above
  if (subtotal >= 500) {
    return 0;
  }

  // Existing logic below (example)
  switch (state) {
    case "Delhi":
      return 75;
    default:
      return 100;
  }
}

