// app/sitemap.ts — Dynamic sitemap for SEO
// Includes all active products + static pages

import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://soukfashionhouse.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all active product slugs
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
  });

  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/orders/track`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/products?category=${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
