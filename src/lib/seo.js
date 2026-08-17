import { BRAND } from "@/config/brand";

/**
 * Shared metadata helpers.
 *
 * Titles are BARE — layout.js sets a "%s | Velaura" template, so adding the
 * brand here would double it. og/canonical paths are RELATIVE — layout.js sets
 * metadataBase, which resolves them to absolute URLs.
 */

/** Trims to a meta-description-friendly length, breaking on a word boundary. */
export function truncate(text, max = 155) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\-–—]$/, "")}…`;
}

// "Men" + "Shirts" -> "Men's Shirts"; "Kids" takes a bare apostrophe.
// Accessories is not a wearer, so its subcategories stand alone ("Watches").
const possessive = (name) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);

export function collectionTitle(categoryName, subcategoryName) {
  if (!subcategoryName) return categoryName;
  if (String(categoryName).toLowerCase() === "accessories") return subcategoryName;
  return `${possessive(categoryName)} ${subcategoryName}`;
}

export function collectionDescription(label) {
  return truncate(
    `Shop ${label} at ${BRAND.name}. Premium, timeless pieces in fine tailoring and honest textiles, made for everyday elegance.`
  );
}

/** Product images are stored relative to /public/images. */
export function productImagePath(mainImage) {
  return mainImage ? `/images${mainImage}` : "/images/product_placeholder.jpg";
}

/** Used when a slug does not resolve — keeps thin 404-ish pages out of the index. */
export const FALLBACK_METADATA = {
  title: "Not found",
  robots: { index: false, follow: false },
};

/**
 * Category routes that exist as views rather than rows in the categories table.
 *
 * "footwear" is special-cased in src/app/api/products/route.js, which matches
 * any subCategoryId containing "footwear" so men's and women's footwear list
 * together. Because there is no matching row, anything that enumerates
 * categories from the database misses it — that is how /footwear ended up
 * noindex'd and absent from the sitemap.
 *
 * Both the [category] metadata and the sitemap read this, so the two cannot
 * drift apart again.
 */
export const VIRTUAL_CATEGORIES = {
  footwear: {
    name: "Footwear",
    description:
      "Shop footwear at Velaura — hand-welted leather, suede and Italian calfskin for men and women.",
    // Products whose subCategoryId contains this belong to the view.
    subCategoryMatch: "footwear",
  },
};
