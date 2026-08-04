import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import { getCartTotal } from "@/lib/cart";
import { validateCoupon, COUPON_MESSAGES } from "@/lib/couponValidation";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { couponCode } = await req.json();
    if (!couponCode) {
      return Response.json(
        { success: false, message: COUPON_MESSAGES.CODE_REQUIRED },
        { status: 400 }
      );
    }

    // 🔑 Get authoritative cart total
    const cartTotal = await getCartTotal(session.user.id);

    // 🎯 Exactly the validation checkout runs — code normalization, usage caps
    // and the rule itself — so the cart and checkout cannot disagree.
    const result = await validateCoupon({
      code: couponCode,
      userId: session.user.id,
      cartTotal,
    });

    if (!result.valid) {
      return Response.json(
        { success: false, reason: result.reason, message: result.message },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      couponCode: result.coupon.code,
      originalAmount: cartTotal,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    });
  } catch (err) {
    console.error("Coupon apply error:", err);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
