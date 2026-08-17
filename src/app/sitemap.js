import { PrismaClient } from "@prisma/client";
import { BRAND } from "@/config/brand";
import { VIRTUAL_CATEGORIES } from "@/lib/seo";

const prisma = new PrismaClient();

// Paths already carry their leading slash, so join without adding another —
// this previously produced "https://site//login" on every static route.
const url = (path) => `${BRAND.siteUrl}${path}`;

export default async function sitemap() {
  // "/shop" is deliberately absent: it is also a category row, and listing it
  // here as well produced a duplicate <loc> at a different priority.
  const staticRoutes = [
    "/",
    "/login",
    "/register",
    "/cart",
    "/newsletter",
    "/checkout",
    "/order-confirmation",
    "/products",
    "/profile",
    "/search",
    "/wishlist",
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
  const categoryRoutes = categories.map((c) => ({
    url: url(`/${c.slug}`),
    lastModified: newestIn((p) => p.categoryId === c.id),
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
