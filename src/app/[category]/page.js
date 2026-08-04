import { ProductPage } from "@/components";
import { getCategoriesCached } from "@/helper/Catalog";
import { collectionDescription, FALLBACK_METADATA } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { category } = await params;
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
