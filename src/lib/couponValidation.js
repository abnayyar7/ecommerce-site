import prisma from "@/lib/prisma";
import { applyCouponRule } from "@/lib/couponRules";

/**
 * Single source of truth for coupon validation.
 *
 * Both the cart step (/api/coupon/apply) and checkout (/api/orders/create) call
 * this, so the two can never disagree about whether a code is usable. They
 * previously diverged on case normalization alone, which showed a customer a
 * discount at the cart and then charged them full price.
 */

export function normalizeCouponCode(code) {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

export const COUPON_MESSAGES = {
  CODE_REQUIRED: "Coupon code required",
  INVALID_CODE: "Invalid coupon code",
  USAGE_LIMIT_REACHED: "This coupon has reached its usage limit",
  ALREADY_USED: "You have already used this coupon",
  NOT_APPLICABLE: "Coupon cannot be applied to this cart",
  BELOW_MINIMUM: "Cart total is below this coupon's minimum",
  EXCEEDS_LIMIT: "Cart total is above this coupon's limit",
  UNKNOWN_RULE: "Coupon cannot be applied",
};

const reject = (reason) => ({
  valid: false,
  reason,
  message: COUPON_MESSAGES[reason] || COUPON_MESSAGES.UNKNOWN_RULE,
});

/**
 * @param {object}  args
 * @param {string}  args.code            raw user input, normalized here
 * @param {string}  args.userId
 * @param {number}  args.cartTotal       authoritative server-side total
 * @param {string} [args.excludeOrderId] ignore usage recorded against this
 *   order. Required when re-validating during a retry of an order that already
 *   recorded its own usage — without it the order's own usage row would make
 *   the coupon look "already used" and the retry would silently drop the
 *   discount.
 * @param {object} [args.client]         prisma client or transaction client
 */
export async function validateCoupon({
  code,
  userId,
  cartTotal,
  excludeOrderId = null,
  client = prisma,
}) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return reject("CODE_REQUIRED");

  const coupon = await client.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon || !coupon.isActive) return reject("INVALID_CODE");

  // Global cap.
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ...reject("USAGE_LIMIT_REACHED"), coupon };
  }

  // Per-customer cap.
  //
  // Scope: enforced per `userId`. Order creation requires an authenticated
  // session, so there is no guest bypass — but a customer who registers a
  // second account gets a second use. Deduplicating on email or phone is
  // deliberately out of scope: it would need normalization rules (plus
  // addressing, aliasing) and a policy decision about blocking genuinely
  // shared household contacts. Per-account is the intended boundary here,
  // not an oversight.
  if (coupon.oncePerCustomer && userId) {
    const priorUses = await client.couponUsage.count({
      where: {
        userId,
        couponId: coupon.id,
        ...(excludeOrderId ? { NOT: { orderId: excludeOrderId } } : {}),
      },
    });
    if (priorUses > 0) return { ...reject("ALREADY_USED"), coupon };
  }

  // Discount maths lives in couponRules.js, keyed by ruleType.
  const result = applyCouponRule(coupon.ruleType, cartTotal);
  if (!result.valid) {
    return { ...reject(result.reason || "UNKNOWN_RULE"), coupon };
  }

  return {
    valid: true,
    coupon,
    discountAmount: result.discountAmount,
    finalAmount: result.finalAmount,
  };
}

/**
 * Records a coupon use. MUST run inside the same transaction as the order
 * write so a failed order never records usage and a successful one always
 * does.
 *
 * Idempotent: the (couponId, orderId) unique constraint means a retry of the
 * same order cannot double-count.
 */
export async function recordCouponUsage(tx, { coupon, userId, orderId }) {
  const existing = await tx.couponUsage.findFirst({
    where: { couponId: coupon.id, orderId },
    select: { id: true },
  });
  if (existing) return false;

  await tx.couponUsage.create({
    data: { userId, coupon: coupon.code, couponId: coupon.id, orderId },
  });
  await tx.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  });
  return true;
}
