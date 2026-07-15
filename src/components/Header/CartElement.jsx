"use client";
import React, { useState, useEffect, useCallback } from "react";
import CartIcon from "@/components/CartIcon";

const CartElement = () => {
  const [cartCount, setCartCount] = useState(0);
  const [cartData, setCartData] = useState(null);
  const [openFromAddCart, setOpenFromAddCart] = useState(false);

  // ── Fetch cart once on mount ─────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (res.ok) {
        setCartData(data);
        setCartCount(data.allQuantity ?? 0);
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ── Listen for item added to cart event ───────────────────────────────────
  useEffect(() => {
    const handleItemAdded = async () => {
      // Refetch cart to get updated data
      await fetchCart();
      // Signal CartIcon to open and auto-close in 2s
      setOpenFromAddCart(true);
    };

    window.addEventListener("itemAddedToCart", handleItemAdded);
    return () => window.removeEventListener("itemAddedToCart", handleItemAdded);
  }, [fetchCart]);

  // ── Silently resync whenever the cart changes elsewhere (checkout,
  //    the /cart page, login-merge, etc.) so this badge never goes stale ──
  useEffect(() => {
    window.addEventListener("cartDataChanged", fetchCart);
    return () => window.removeEventListener("cartDataChanged", fetchCart);
  }, [fetchCart]);

  return (
    <CartIcon
      cartCount={cartCount}
      cartData={cartData}
      onCountChange={setCartCount}
      onCartDataChange={setCartData}
      fetchCart={fetchCart}
      openFromAddCart={openFromAddCart}
      setOpenFromAddCart={setOpenFromAddCart}
    />
  );
};

export default CartElement;
