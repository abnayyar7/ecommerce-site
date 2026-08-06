import { cache } from "react";
import prisma from "@/lib/prisma";

/**
 * Product lookup shared by the PDP's generateMetadata() and its page component.
 *
 * React.cache() dedupes within a single render pass, so the two callers cost
 * one database query rather than two. Both MUST call this helper — reverting
 * either to its own query silently doubles the per-render cost.
 *
 * Queries Prisma directly rather than fetching /api/slugs: that route made the
 * app issue an HTTP request to itself on every product page render.
 *
 * `category` is included because ProductTabs reads product.category.name.
 */
export const getProductBySlug = cache(async (slug) => {
  if (!slug) return null;

  return prisma.product.findFirst({
    where: { slug },
    include: { category: true },
  });
});

/**
 * Gallery shots for a product, in display order.
 *
 * Mirrors GET /api/images/[id] exactly — same where, orderBy and select — so
 * the PDP renders identically without the page fetching its own API over HTTP.
 * ProductImage has no position column, so order rides on the deterministic row
 * ids the seeder writes; see syncGallery() in src/scripts/insertDemoData.js.
 *
 * Returns [] when a product has no gallery rows, which is what the previous
 * fetch returned on a non-ok response — PDPProductImages then shows the hero
 * alone and hides the thumbnail strip.
 *
 * The route itself stays for external consumers; only the self-call is gone.
 */
export const getProductImages = cache(async (productId) => {
  if (!productId) return [];

  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { id: "asc" },
    select: { id: true, url: true },
  });
});
