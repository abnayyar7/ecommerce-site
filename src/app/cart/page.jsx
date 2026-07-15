import { CartClient } from "@/components";
import { BRAND } from "@/config/brand";

export const metadata = {
  title: `Your Cart | ${BRAND.name}`,
};

const CartPage = () => {
  return <CartClient />;
};

export default CartPage;
