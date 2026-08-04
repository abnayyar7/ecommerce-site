import { ProductPage } from "@/components";
import { getCategoriesCached, getSubCategoriesCached } from "@/helper/Catalog";
import {
  collectionTitle,
  collectionDescription,
  FALLBACK_METADATA,
} from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { category, subcategory } = await params;
  const [categories, subcategories] = await Promise.all([
    getCategoriesCached(),
    getSubCategoriesCached(),
  ]);

  const cat = categories.find((c) => c.slug === category);
  // Matched against the parent too, so /women/shirts-men does not resolve.
  const sub = subcategories.find(
    (s) => s.slug === subcategory && (!cat || s.categoryId === cat.id)
  );

  if (!cat || !sub) return FALLBACK_METADATA;

  const label = collectionTitle(cat.name, sub.name);
  const path = `/${cat.slug}/${sub.slug}`;
  const description = collectionDescription(label);

  return {
    // Bare title — layout.js appends "| Velaura" via its template.
    title: label,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: label,
      description,
      type: "website",
      url: path,
    },
  };
}

const subCategoriesPage = ({ params, searchParams }) => {
  return (
    <div>
      <ProductPage params={params} searchParams={searchParams} />
    </div>
  );
};

export default subCategoriesPage;
