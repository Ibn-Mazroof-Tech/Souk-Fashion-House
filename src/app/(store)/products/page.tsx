// ─────────────────────────────────────────────────────────────────────────────
// app/(store)/products/page.tsx — Collection Page (SSR)
// Replaces: collection.html + collection.js
// Reads URL search params server-side → queries DB → renders grid
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductFilters } from "@/components/store/ProductFilters";
import type { Prisma } from "@prisma/client";

type SearchParams = {
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
  featured?: string;
  color?: string; // comma-separated color names
};

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const cat = searchParams.category;
  return {
    title: cat ? `${cat.charAt(0).toUpperCase() + cat.slice(1)} Collection` : "All Collections",
    description: "Browse our curated ethnic wear collection — Kashmiri pherans, Pakistani suits, and pashmina shawls.",
  };
}

// SSR on every request — search/filter results must be fresh
export const dynamic = "force-dynamic";

const LIMIT = 12;

async function getProducts(params: SearchParams) {
  const category = params.category || "all";
  const search = params.search || "";
  const sort = params.sort || "featured";
  const page = Math.max(1, parseInt(params.page || "1"));
  const featuredOnly = params.featured === "true";
  const selectedColors = params.color ? params.color.split(",").filter(Boolean) : [];

  const where: Prisma.ProductWhereInput = { active: true };
  if (category !== "all") where.category = { slug: category };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (featuredOnly) where.featured = true;
  if (selectedColors.length > 0) {
    where.variants = { some: { color: { in: selectedColors } } };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { featured: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  else if (sort === "price-desc") orderBy = { price: "desc" };
  else if (sort === "newest") orderBy = { createdAt: "desc" };

  const [products, total, categories, colorRows] = await Promise.all([
    prisma.product.findMany({
      where, orderBy,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: { category: true, _count: { select: { reviews: true, variants: true } } },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    // Available colors across all active products — for the filter list
    prisma.productVariant.findMany({
      where: { product: { active: true } },
      select: { color: true, colorHex: true },
      distinct: ["color"],
      orderBy: { color: "asc" },
    }),
  ]);

  return { products, total, categories, colors: colorRows, page, pages: Math.ceil(total / LIMIT) };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { products, total, categories, colors, page, pages } = await getProducts(searchParams);
  const category = searchParams.category || "all";
  const selectedColors = searchParams.color ? searchParams.color.split(",").filter(Boolean) : [];

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 py-10 page-enter">

      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-medium text-stone-900 mb-2">
          {category === "all"
            ? "All Collections"
            : categories.find((c) => c.slug === category)?.name ?? category}
        </h1>
        <p className="text-stone-500 font-sans">
          {total} piece{total !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* ── Filters (client component) ── */}
      <ProductFilters
        categories={categories}
        currentCategory={category}
        currentSort={searchParams.sort || "featured"}
        currentSearch={searchParams.search || ""}
        colors={colors}
        currentColors={selectedColors}
      />

      {/* ── Product grid ── */}
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 mt-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams({
                  ...(searchParams as Record<string, string>),
                  page: String(p),
                });
                return (
                  <a
                    key={p}
                    href={`/products?${params.toString()}`}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-souk-700 text-white"
                        : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="font-display text-3xl text-stone-400 mb-3">No products found</p>
          <p className="text-stone-500 text-sm">
            Try a different search term or category.
          </p>
          <a href="/products" className="inline-block mt-4 btn-souk px-6 py-2.5 rounded-xl text-sm">
            View all collections
          </a>
        </div>
      )}
    </div>
  );
}
