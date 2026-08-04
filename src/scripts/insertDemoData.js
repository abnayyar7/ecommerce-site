import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { categories, subcategories } from "./categoryData.js";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePathProduct = path.join(__dirname, "products.json");
const publicImagesDir = path.join(__dirname, "..", "..", "public", "images");
const productsData = JSON.parse(await readFile(filePathProduct, "utf8"));

// Products are upserted by `id`, not by `slug`. Cart items, order items and
// wishlist rows reference productId, so reusing ids keeps those rows valid
// while the catalog content behind them is replaced.
const toProductFields = (product) => ({
  title: product.title,
  slug: product.slug,
  description: product.description,
  price: product.price,
  rating: product.rating,
  manufacturer: product.manufacturer,
  colour: product.colour ?? null,
  categoryId: product.categoryId,
  subCategoryId: product.subCategoryId,
  mainImage: product.mainImage,
  inStock: product.inStock,
  stockOnHand: product.stockOnHand ?? product.inStock ?? 0,
  availableSizes: product.availableSizes,
  defaultSize: product.defaultSize,
  selectedSize: product.selectedSize,
  sizeMetric: product.sizeMetric,
  keyFeatures: product.keyFeatures,
  isFeatured: product.isFeatured || false,
});

// Stored image paths are relative to /public/images. A path that points at a
// missing file still seeds fine but renders as a broken thumbnail, so surface
// it at seed time rather than in the browser.
const imageFileMissing = (imagePath) =>
  !!imagePath && !existsSync(path.join(publicImagesDir, imagePath));

// ProductImage has no position column, so shot order is carried by the row id:
// `<productId>--01`, `--02`, ... The gallery API sorts by id to recover it.
// Zero-padded so the lexicographic sort stays correct past nine images.
const galleryRowId = (productId, index) =>
  `${productId}--${String(index + 1).padStart(2, "0")}`;

// Mirrors the `gallery` array from products.json onto ProductImage rows:
// upserts what is listed, deletes what is not. Safe to re-run.
async function syncGallery(product) {
  const gallery = Array.isArray(product.gallery) ? product.gallery : [];

  if (gallery.length === 0) {
    const { count } = await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });
    return { added: 0, removed: count };
  }

  const rows = gallery.map((url, index) => ({
    id: galleryRowId(product.id, index),
    url,
    productId: product.id,
  }));

  const { count: removed } = await prisma.productImage.deleteMany({
    where: { productId: product.id, id: { notIn: rows.map((r) => r.id) } },
  });

  for (const row of rows) {
    await prisma.productImage.upsert({
      where: { id: row.id },
      update: { url: row.url, productId: row.productId },
      create: row,
    });
  }

  return { added: rows.length, removed };
}

// Counts rows that represent real user or order history. ProductImage is
// deliberately excluded: gallery rows are seeder-owned and are cleaned up with
// the product rather than being a reason to keep it.
async function countDependents(productId) {
  const [cartItems, orderItems, wishlist, legacyOrderItems] = await Promise.all([
    prisma.cartItem.count({ where: { productId } }),
    prisma.orderItem.count({ where: { productId } }),
    prisma.wishlist.count({ where: { productId } }),
    prisma.customer_order_product.count({ where: { productId } }),
  ]);
  return cartItems + orderItems + wishlist + legacyOrderItems;
}

// Any product no longer in products.json is removed when nothing references it.
// Rows that are still referenced are kept (deleting them would break order
// history) but are renamed out of the way so they cannot collide with a catalog
// slug and cannot surface in listings.
async function retireStaleProducts(catalogIds, catalogSlugs) {
  const stale = await prisma.product.findMany({
    where: { id: { notIn: catalogIds } },
    select: { id: true, slug: true, title: true },
  });
  if (stale.length === 0) {
    console.log("No stale products to retire.");
    return;
  }

  for (const product of stale) {
    const dependents = await countDependents(product.id);
    if (dependents === 0) {
      // ProductImage has a required FK, so its rows go first.
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
      console.log(`Removed stale product: ${product.slug}`);
      continue;
    }

    const archivedSlug = `archived-${product.id}-${product.slug}`.slice(0, 180);
    await prisma.product.update({
      where: { id: product.id },
      data: {
        slug: catalogSlugs.has(product.slug) ? archivedSlug : product.slug,
        inStock: 0,
        stockOnHand: 0,
        isFeatured: false,
      },
    });
    console.log(
      `Archived stale product "${product.slug}" (${dependents} referencing rows kept intact).`
    );
  }
}

// Frees a slug held by a *different* product id before the upsert runs, so the
// unique constraint on Product.slug can never abort the seed mid-way.
async function releaseConflictingSlugs(catalogIds) {
  const catalogSlugs = productsData.map((p) => p.slug);
  const conflicts = await prisma.product.findMany({
    where: { slug: { in: catalogSlugs }, id: { notIn: catalogIds } },
    select: { id: true, slug: true },
  });

  for (const conflict of conflicts) {
    await prisma.product.update({
      where: { id: conflict.id },
      data: { slug: `archived-${conflict.id}-${conflict.slug}`.slice(0, 180) },
    });
    console.log(
      `Released slug "${conflict.slug}" held by legacy product ${conflict.id}.`
    );
  }
}

async function insertDemoData() {
  console.log("Seeding categories...");
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }
  console.log("Categories synced successfully!");

  console.log("Seeding subcategories...");
  for (const subcategory of subcategories) {
    await prisma.subCategory.upsert({
      where: { id: subcategory.id },
      update: subcategory,
      create: subcategory,
    });
  }
  console.log("Subcategories synced successfully!");

  const catalogIds = productsData.map((p) => p.id);
  const catalogSlugs = new Set(productsData.map((p) => p.slug));

  console.log("Retiring products that are no longer in the catalog...");
  await retireStaleProducts(catalogIds, catalogSlugs);
  await releaseConflictingSlugs(catalogIds);

  console.log(`Syncing products from ${filePathProduct}...`);
  let count = 0;
  let galleryRows = 0;
  const failed = [];
  const missingFiles = [];
  for (const product of productsData) {
    const fields = toProductFields(product);
    try {
      await prisma.product.upsert({
        where: { id: product.id },
        update: fields,
        create: { id: product.id, ...fields },
      });

      const { added } = await syncGallery(product);
      galleryRows += added;

      if (imageFileMissing(product.mainImage)) {
        missingFiles.push(`${product.slug} (main): ${product.mainImage}`);
      }
      for (const url of product.gallery || []) {
        if (imageFileMissing(url)) {
          missingFiles.push(`${product.slug} (gallery): ${url}`);
        }
      }

      count++;
      if (count % 20 === 0) console.log(`Processed ${count} products...`);
    } catch (error) {
      failed.push(product.slug);
      console.error(
        `Failed to sync product: ${product.slug}. Error: ${error.message}`
      );
    }
  }

  console.log(`Successfully synced ${count}/${productsData.length} products!`);
  console.log(`Gallery images synced: ${galleryRows}`);

  if (missingFiles.length > 0) {
    console.warn(
      `\n⚠ ${missingFiles.length} image path(s) have no file under public/images — these will render broken:`
    );
    missingFiles.forEach((entry) => console.warn(`   ${entry}`));
  }

  if (failed.length > 0) {
    console.error(`Products that failed: ${failed.join(", ")}`);
    process.exitCode = 1;
  }
}

insertDemoData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
