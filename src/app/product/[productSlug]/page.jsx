import { Breadcrumb, PDPClient } from "@/components";
import { getProductBySlug, getProductImages } from "@/lib/getProduct";
import {
  truncate,
  productImagePath,
  FALLBACK_METADATA,
} from "@/lib/seo";
import { notFound } from "next/navigation";
import React from "react";

export async function generateMetadata({ params }) {
  const { productSlug } = await params;
  // Same cached helper the page uses, so this costs no extra query.
  const product = await getProductBySlug(productSlug);

  if (!product) return FALLBACK_METADATA;

  const path = `/product/${product.slug}`;
  const description = truncate(product.description);
  const image = productImagePath(product.mainImage);

  return {
    // Bare title — layout.js appends "| Velaura" via its template.
    title: product.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: product.title,
      description,
      type: "website",
      url: path,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: [image],
    },
  };
}

const SingleProductPage = async ({ params }) => {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  const images = await getProductImages(product.id);

  return (
    <div className="bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)]">
      {/* Breadcrumb */}
      <div className="bg-[var(--color-inverted-bg)] mt-28">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-24 mb-4">
          <Breadcrumb />
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 md:px-24 py-10">
        <PDPClient product={product} images={images} />
      </div>
    </div>
  );
};

export default SingleProductPage;
