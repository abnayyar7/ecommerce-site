"use client";
import React, { Suspense } from "react";
import { OrderConfirmation } from "@/components";
import { useSearchParams } from "next/navigation";

const OrderConfirmationInner = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return <OrderConfirmation orderId={orderId} />;
};

const OrderConfirmationPage = () => {
  return (
    <Suspense fallback={<div className="py-32 text-center text-lg">Loading order details...</div>}>
      <OrderConfirmationInner />
    </Suspense>
  );
};

export default OrderConfirmationPage;
