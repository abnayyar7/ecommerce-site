import { PrismaClient } from "@prisma/client";
import { BRAND } from "@/config/brand";
const prisma = new PrismaClient();

export default async function sitemap() {
  // Pull routes from your DB: products, categories, blog, etc.
  const staticRoutes = [
    "",
    "/login",
    "/register",
    "/cart",
    "/newsletter",
    "/checkout",
    "/order-confirmation",
    "/products",
    "/profile",
    "/search",
    "/shop",
    "/wishlist",
  ].map((p) => ({
    url: `${BRAND.siteUrl}/${p}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  // Example: dynamic products
  const products = await prisma.product.findMany();
  const productRoutes = products.map((p) => ({
    url: `${BRAND.siteUrl}/product/${p.slug}`,
    changeFrequency: "daily",
    priority: 0.9,
  }));
  return [...staticRoutes, ...productRoutes];
}
