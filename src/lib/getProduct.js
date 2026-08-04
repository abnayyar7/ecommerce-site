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
