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
    sitemap: isProd ? "https://example.com/sitemap.xml" : undefined,
    host: "https://example.com/",
  };
}
