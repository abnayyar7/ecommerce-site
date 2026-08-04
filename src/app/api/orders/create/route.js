import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import { validateCoupon, recordCouponUsage } from "@/lib/couponValidation";
import { shippingCharges } from "@/helper/common";

function isEnvFlagEnabled(value) {
  return ["1", "true", "yes", "on"].includes(
    String(value || "")
      .trim()
      .toLowerCase(),
  );
}

function generateOrderId() {
  const timestamp = Date.now(); // ms since epoch
  const random = Math.floor(10000 + Math.random() * 90000); // 5-digit

  return `ORD-${timestamp}-${random}`;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  let finalOrderId = null;

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();

    const {
      orderId, // optional
      contact,
      address,
      products, // UI list (NOT trusted for pricing)
      couponCode, // coupon intent only
    } = body;

    if (
      !contact?.email ||
      !contact?.phone ||
      !address?.address1 ||
      !address?.city ||
      !address?.state ||
      !address?.pincode
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    /* ------------------ FETCH CART FROM DB (SOURCE OF TRUTH) ------------------ */

    const cart = await prisma.cart.findFirst({
      where: { userId, status: "active" },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    /* ------------------ CALCULATE ORIGINAL AMOUNT ------------------ */

    finalOrderId = orderId || generateOrderId();
    let originalAmount = 0;

    cart.items.forEach((item) => {
      originalAmount += Math.round(item.product.price * item.quantity);
    });

    /* ------------------ APPLY COUPON (AUTHORITATIVE) ------------------ */

    let discountAmount = 0;
    let finalAmount = originalAmount;
    let appliedCoupon = null;
    let appliedCouponId = null;
    let appliedCouponCode = null;

    if (couponCode) {
      // Same validator the cart step uses, so a code accepted there is
      // accepted here. It normalizes case internally — the raw string was
      // previously looked up here, so "welcome2026" silently lost its discount
      // between cart and checkout.
      //
      // excludeOrderId keeps a retry of THIS order from tripping its own
      // already-recorded usage and dropping the discount.
      const result = await validateCoupon({
        code: couponCode,
        userId,
        cartTotal: originalAmount,
        excludeOrderId: finalOrderId,
      });

      if (result.valid) {
        discountAmount = result.discountAmount;
        finalAmount = result.finalAmount;
        appliedCoupon = result.coupon;
        appliedCouponId = result.coupon.id;
        appliedCouponCode = result.coupon.code;
      }
    }

    /* ------------------ SHIPPING CALCULATION ------------------ */

    const shippingEnabled = isEnvFlagEnabled(process.env.SHIPPING_ENABLED);
    let shippingAmount = 0;
    if (shippingEnabled) {
      try {
        const calculatedShipping = shippingCharges(address?.state, finalAmount);
        if (Number.isFinite(calculatedShipping) && calculatedShipping > 0) {
          shippingAmount = calculatedShipping;
        }
      } catch {
        shippingAmount = 0;
      }
    }

    const payableAmount = finalAmount + shippingAmount;

    /* ------------------ DEFAULT ADDRESS RULE ------------------ */

    if (address.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    /* ------------------ SAVE / UPDATE ADDRESS ------------------ */

    let savedAddress;

    if (address.id) {
      savedAddress = await prisma.address.update({
        where: { id: address.id },
        data: {
          address1: address.address1,
          address2: address.address2 || null,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: "India",
          landmark: address.landmark || null,
          label: address.label || "HOME",
          isDefault: address.isDefault || false,
          userId,
        },
      });
    } else {
      savedAddress = await prisma.address.create({
        data: {
          name: contact.name,
          phone: contact.phone,
          address1: address.address1,
          address2: address.address2 || null,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: "India",
          landmark: address.landmark || null,
          label: address.label || "HOME",
          isDefault: address.isDefault || false,
          userId,
        },
      });
    }

    /* ------------------ UPSERT ORDER ------------------ */

    // The order write and the coupon usage record share one transaction: a
    // failed order can never record usage, and a successful one always does.
    const order = await prisma.$transaction(async (tx) => {
      const saved = await tx.order.upsert({
      where: { id: finalOrderId },

      update: {
        addressId: savedAddress.id,
        email: contact.email,
        phone: contact.phone,

        originalAmount,
        discountAmount,
        finalAmount,
        shippingAmount,

        couponId: appliedCouponId,
        couponCode: appliedCouponCode,

        updatedAt: new Date(),
      },

      create: {
        id: finalOrderId,
        userId,
        addressId: savedAddress.id,
        status: "pending",

        email: contact.email,
        phone: contact.phone,
        amount: originalAmount,
        originalAmount,
        discountAmount,
        finalAmount,
        shippingAmount,

        couponId: appliedCouponId,
        couponCode: appliedCouponCode,

        products: {
          create: cart.items.map((item) => ({
            productId: item.product.id,
            title: item.product.title,
            slug: item.product.slug,
            mainImage: item.product.mainImage,
            price: item.product.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize || null,
            sizeMetric: item.product.sizeMetric || null,
          })),
        },
      },

      include: {
        products: true,
        address: true,
      },
      });

      if (appliedCoupon) {
        await recordCouponUsage(tx, {
          coupon: appliedCoupon,
          userId,
          orderId: saved.id,
        });
      }

      return saved;
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      payableAmount,
      order,
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save order", orderId: finalOrderId },
      { status: 500 },
    );
  }
}
