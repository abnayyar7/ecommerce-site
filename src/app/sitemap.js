import { PrismaClient } from "@prisma/client";
import { BRAND } from "@/config/brand";
import { VIRTUAL_CATEGORIES } from "@/lib/seo";

const prisma = new PrismaClient();

// Paths already carry their leading slash, so join without adding another —
// this previously produced "https://site//login" on every static route.
const url = (path) => `${BRAND.siteUrl}${path}`;

export default async function sitemap() {
  // Public, indexable pages only.
  //
  // Deliberately absent:
  //   /newsletter, /products      — no route exists; both 404
  //   /login, /register, /cart,   — private or transactional; nothing to index,
  //   /checkout, /profile,          and crawling them only burns crawl budget
  //   /wishlist, /order-confirmation
  //   /order-status/[id]          — per-order, requires an id
  //   /shop                       — also a category row, listed once below
  const staticRoutes = [
    "/",
    "/search",
    "/about-us",
    "/contact-us",
    "/privacy-policy",
    "/return-and-refund",
    "/shipping-delivery-policy",
    "/terms-and-conditions",
  ].map((path) => ({
    url: url(path),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const [categories, products] = await Promise.all([
    // id is needed as well as slug — products join on categoryId, and selecting
    // slug alone left every category without a lastModified.
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.product.findMany({
      select: { slug: true, updatedAt: true, categoryId: true, subCategoryId: true },
    }),
  ]);

  // Category has no timestamp column, so freshness comes from its products.
  const newestIn = (predicate) => {
    const dates = products.filter(predicate).map((p) => p.updatedAt);
    return dates.length ? new Date(Math.max(...dates)) : undefined;
  };

  // Real category rows — these were missing entirely, so /men, /women, /kids,
  // /accessories and /shop were never advertised to crawlers.
  //
  // "shop" has no directly assigned products, so it falls back to the newest
  // product overall — it lists the whole catalog, and that is its freshness.
  const newestOverall = newestIn(() => true);
  const categoryRoutes = categories.map((c) => ({
    url: url(`/${c.slug}`),
    lastModified: newestIn((p) => p.categoryId === c.id) ?? newestOverall,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Views with no matching row. Enumerating the table alone skips them.
  const virtualCategoryRoutes = Object.entries(VIRTUAL_CATEGORIES).map(
    ([slug, config]) => ({
      url: url(`/${slug}`),
      lastModified: newestIn((p) =>
        p.subCategoryId.includes(config.subCategoryMatch)
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const productRoutes = products.map((p) => ({
    url: url(`/product/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...virtualCategoryRoutes,
    ...productRoutes,
  ];
}
