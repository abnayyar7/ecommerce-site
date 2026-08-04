import prisma from "@/lib/prisma";

// Gallery shots for a product, in the order they should appear on the PDP.
// ProductImage has no position column, so the seeder writes deterministic ids
// (`<productId>--01`, `--02`, ...) and ordering rides on those.
// See syncGallery() in src/scripts/insertDemoData.js.
export async function GET(request, { params }) {
  const { id } = await params;

  // The PDP resolves the product and its images in parallel, so this can be
  // called with an undefined id on a 404 slug. An empty gallery is the correct
  // answer there, not an error.
  if (!id || id === "undefined") {
    return Response.json([]);
  }

  try {
    const images = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { id: "asc" },
      select: { id: true, url: true },
    });

    return Response.json(images);
  } catch (error) {
    console.error("Error fetching product images:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
