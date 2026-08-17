import { ProductPage } from "@/components";
import { getCategoriesCached } from "@/helper/Catalog";
import { collectionDescription, FALLBACK_METADATA } from "@/lib/seo";

/**
 * "footwear" is not a row in the categories table — it is a cross-category view
 * that /api/products special-cases, matching any subCategoryId containing
 * "footwear" so men's and women's footwear appear together. The homepage links
 * to it and it returns products, so it must carry real metadata rather than the
 * unknown-slug fallback, which had it titled "Not found" and noindex'd.
 *
 * Kept in step with the `category === "footwear"` branch in
 * src/app/api/products/route.js.
 */
const VIRTUAL_CATEGORIES = {
  footwear: {
    name: "Footwear",
    description:
      "Shop footwear at Velaura — hand-welted leather, suede and Italian calfskin for men and women.",
  },
};

export async function generateMetadata({ params }) {
  const { category } = await params;

  const virtual = VIRTUAL_CATEGORIES[category];
  if (virtual) {
    const path = `/${category}`;
    return {
      // Bare title — layout.js appends "| Velaura" via its template.
      title: virtual.name,
      description: virtual.description,
      alternates: { canonical: path },
      openGraph: {
        title: virtual.name,
        description: virtual.description,
        type: "website",
        url: path,
      },
    };
  }

  const categories = await getCategoriesCached();
  const match = categories.find((c) => c.slug === category);

  if (!match) return FALLBACK_METADATA;

  const path = `/${match.slug}`;
  const description = collectionDescription(match.name);

  return {
    // Bare title — layout.js appends "| Velaura" via its template.
    title: match.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: match.name,
      description,
      type: "website",
      url: path,
    },
  };
}

const categoriesPage = ({ params, searchParams }) => {
  return (
    <div>
      <ProductPage params={params} searchParams={searchParams} />
    </div>
  );
};

export default categoriesPage;
