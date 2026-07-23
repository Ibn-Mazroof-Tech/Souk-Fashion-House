// app/robots.ts — SEO robots.txt
import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://soukfashionhouse.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/account/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
