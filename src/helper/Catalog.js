// lib/data/catalog.js
import { unstable_cache } from "next/cache";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ---- CATEGORIES ----
export const getCategoriesCached = unstable_cache(
  async () => prisma.category.findMany(),
  ["categories:v1"],
  { revalidate: 60 * 60 * 24, tags: ["categories"] } // 24h + tag
);

export const getSubCategoriesCached = unstable_cache(
  async () => prisma.subCategory.findMany(),
  ["subcategories:v1"],
  { revalidate: 60 * 60 * 24, tags: ["subcategories"] } // 24h + tag
);

// ---- SALE PRODUCTS ----
// If you use discountPercent:
// export const getSaleProductsCached = (limit = 12) =>
//   unstable_cache(
//     async () =>
//       prisma.product.findMany({
//         where: { discountPercent: { gt: 0 }, isActive: true },
//         orderBy: { updatedAt: "desc" },
//         take: limit,
//         include: { images: true, category: true },
//       }),
//     [`products:sale:v1:limit=${limit}`],
//     { revalidate: 60 * 30, tags: ["products:sale"] }
//   )();

// If you use salePrice instead, swap where clause:
// where: { salePrice: { not: null }, isActive: true }
