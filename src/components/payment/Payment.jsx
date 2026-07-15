"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useProductStore } from "@/app/_zustand/store";
import { CodPayment } from "@/components";

export default function Payment({ onPay, orderData, orderTotal, orderId }) {
  const PAY_AMOUNT = orderTotal;
  const [codLoading, setCodLoading] = useState(false);
  const router = useRouter();
  const { clearCart } = useProductStore();

  const handlePay = async (e) => {
    e.preventDefault();

    if (!orderId) {
      toast.error("Order not ready yet. Please try again.");
      return;
    }

    setCodLoading(true);

    try {
      const res = await fetch("/api/cod/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to place COD order");
      }

      onPay && onPay({ method: "cod", orderId });
      await clearCart();
      window.location.href = `/order-confirmation?orderId=${orderId}`;
    } catch (err) {
      console.error("COD ORDER ERROR:", err);
      toast.error(
        err.message || "Failed to place COD order. Please try again.",
      );
    } finally {
      setCodLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      <div className="bg-white p-4 rounded-xl border space-y-3">
        <h3 className="font-semibold text-[var(--color-inverted-text)]">
          Payment Method
        </h3>
        <p className="text-sm text-gray-700">
          Cash on Delivery (COD) is the only payment option available at
          checkout.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <CodPayment />
      </div>

      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Order Total</div>
            <div className="text-xl font-semibold">₹{PAY_AMOUNT}</div>
          </div>

          <button
            onClick={handlePay}
            disabled={codLoading}
            className="bg-[var(--color-bg)] text-white px-5 py-3 rounded-lg disabled:opacity-60"
          >
            {codLoading ? "Placing Order..." : "Place COD Order"}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          By continuing, you agree to our Terms & Conditions.
        </p>
      </div>
    </div>
  );
}
