import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://everydaytab.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /og?… must stay crawlable so social/search bots can fetch og:image.
        allow: ["/", "/og?*"],
        disallow: ["/api/", "/settings", "/favorites", "/*?category=", "/*?search=", "/*?*"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
