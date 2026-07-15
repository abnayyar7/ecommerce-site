import { BRAND } from "@/config/brand";

export default function robots() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: isProd ? [] : ["/"],
      },
    ],
    sitemap: isProd ? `${BRAND.siteUrl}/sitemap.xml` : undefined,
    host: `${BRAND.siteUrl}/`,
  };
}
