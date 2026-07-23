// ─────────────────────────────────────────────────────────────────────────────
// app/(store)/products/[slug]/page.tsx — Product Detail Page (SSG)
// Replaces: product.html + product.js
// generateStaticParams → pre-renders all product pages at build time
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { waLink } from "@/lib/utils/format";
import { ProductDetailClient } from "@/components/store/ProductDetailClient";
import { ProductCard } from "@/components/store/ProductCard";

// SSG — pre-generate all product pages at build
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, images: true, price: true },
  });
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description ?? `Buy ${product.name} at Souk Fashion House`,
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

// Revalidate hourly — allows admin price updates to reflect
export const revalidate = 3600;

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, active: true },
    include: {
      category: true,
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      colorImages: true,
      reviews: {
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product) notFound();

  // Related products — same category, up to 4
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, active: true },
    take: 4,
    include: { category: true, _count: { select: { reviews: true, variants: true } } },
  });

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  const waInquiry = waLink(`Hi, I'm interested in ${product.name} (${product.slug})`);

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 py-10 page-enter">

      {/* ── Breadcrumb ── */}
      <nav className="text-xs text-stone-400 font-sans mb-6 flex items-center gap-1.5">
        <a href="/" className="hover:text-souk-700 transition-colors">Home</a>
        <span>/</span>
        <a href="/products" className="hover:text-souk-700 transition-colors">Collections</a>
        <span>/</span>
        <a href={`/products?category=${product.category.slug}`} className="hover:text-souk-700 transition-colors">
          {product.category.name}
        </a>
        <span>/</span>
        <span className="text-stone-600">{product.name}</span>
      </nav>

      {/* ── Product grid — gallery + details combined in one client component so
           the gallery can react to color selection ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        <ProductDetailClient
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            mrp: product.mrp,
            images: product.images,
            sizes: product.sizes,
            stock: product.stock,
            variants: product.variants,
            colorImages: product.colorImages,
          }}
          waInquiry={waInquiry}
          categoryName={product.category.name}
          categorySlug={product.category.slug}
          avgRating={avgRating}
          reviewCount={product._count.reviews}
          description={product.description ?? "Premium quality ethnic wear designed for comfort and festive elegance."}
        />
      </div>

      {/* ── Reviews section ── */}
      {product.reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-medium text-stone-900 mb-6">
            Customer Reviews
            <span className="ml-3 text-base font-sans font-normal text-stone-400">({product._count.reviews})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-souk-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {r.user.image ? (
                      <img src={r.user.image} alt={r.user.name ?? ""} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-souk-100 flex items-center justify-center text-souk-700 text-xs font-bold">
                        {r.user.name?.[0] ?? "U"}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-stone-800">{r.user.name ?? "Customer"}</span>
                    {r.verified && (
                      <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">✓ Verified</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={`text-sm ${s <= r.rating ? "text-amber-400" : "text-stone-200"}`}>★</span>
                    ))}
                  </div>
                </div>
                {r.title && <p className="text-sm font-semibold text-stone-900 mb-1">{r.title}</p>}
                {r.body && <p className="text-sm text-stone-500 leading-relaxed font-sans">{r.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Related products — preserved from product.js ── */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-medium text-stone-900 mb-6">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
