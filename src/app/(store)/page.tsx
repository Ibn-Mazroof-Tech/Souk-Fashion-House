// ─────────────────────────────────────────────────────────────────────────────
// app/(store)/page.tsx — Home Page
// SSG (revalidate: 3600) — Replaces index.html + main.js
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Truck, RefreshCw, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";
import { fmt } from "@/lib/utils/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Souk Fashion House — Premium Ethnic Wear",
  description: "Discover premium Kashmiri pherans, Pakistani suits, and pashmina shawls.",
};

// ISR: revalidate every hour
export const revalidate = 3600;

async function getHomeData() {
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true, active: true },
      take: 6,
      include: {
        category: true,
        _count: { select: { reviews: true, variants: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      include: { _count: { select: { products: { where: { active: true } } } } },
    }),
  ]);
  return { featuredProducts, categories };
}

export default async function HomePage() {
  const { featuredProducts, categories } = await getHomeData();

  return (
    <div className="page-enter">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-cream-100 via-cream-50 to-white overflow-hidden">
        {/* Decorative element */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-[0.04] pointer-events-none">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `radial-gradient(circle, #8b3d3d 1px, transparent 1px)`,
            backgroundSize: "28px 28px"
          }} />
        </div>

        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-souk-50 border border-souk-100 rounded-full px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-souk-700 animate-pulse" />
                <span className="text-xs font-semibold text-souk-700 tracking-wider uppercase">New Collection Available</span>
              </div>

              <h1 className="font-display text-5xl md:text-6xl font-medium text-stone-900 leading-[1.08]">
                Where Heritage<br />
                <em className="text-souk-700 not-italic">Meets Style</em>
              </h1>

              <p className="text-lg text-stone-500 leading-relaxed max-w-md font-sans">
                Authentic Kashmiri pherans, curated Pakistani suits, and handcrafted pashmina shawls — delivered across India.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="btn-souk h-12 px-7 rounded-xl inline-flex items-center gap-2 text-base"
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/orders/track"
                  className="btn-souk-ghost btn-souk h-12 px-7 rounded-xl inline-flex items-center gap-2 text-base"
                >
                  Track Order
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                {[
                  { icon: Truck, label: "Free delivery across India" },
                  { icon: RefreshCw, label: "7-day exchange" },
                  { icon: Shield, label: "Secure payments" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-sm text-stone-500">
                    <Icon className="w-4 h-4 text-souk-700" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero images grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-souk-md">
                  <Image
                    src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80"
                    alt="Kashmiri Pheran"
                    fill className="object-cover"
                    priority sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-stone-900 text-xs font-semibold px-2.5 py-1 rounded-full">Pherans</span>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-square shadow-souk-sm">
                  <Image
                    src="https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=600&q=80"
                    alt="Pashmina Shawl"
                    fill className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <div className="relative rounded-2xl overflow-hidden aspect-square shadow-souk-sm">
                  <Image
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80"
                    alt="Pakistani Suit"
                    fill className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-souk-md">
                  <Image
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80"
                    alt="Festive Set"
                    fill className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-stone-900 text-xs font-semibold px-2.5 py-1 rounded-full">Pakistani Suits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories — replaces category-cards from main.js ── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-medium text-stone-900">
            Shop by Category
          </h2>
          <Link href="/products" className="text-sm font-medium text-souk-700 hover:text-souk-800 flex items-center gap-1">
            All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* All collections card */}
          <Link
            href="/products"
            className="group relative rounded-2xl overflow-hidden aspect-square bg-souk-700 hover:bg-souk-800 transition-colors flex flex-col justify-end p-5 shadow-souk-sm"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_right,_#fff,_transparent)]" />
            <div className="relative">
              <p className="font-display text-2xl font-semibold text-white">All</p>
              <p className="text-souk-200 text-sm font-sans">
                {categories.reduce((sum, c) => sum + c._count.products, 0)} products
              </p>
            </div>
          </Link>

          {/* Dynamic categories — replaces hardcoded cats[] from collection.js */}
          {categories.map((cat, i) => {
            const heroImages: Record<string, string> = {
              pherans: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=400&q=80",
              pakistani: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
              shawls: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=400&q=80",
            };
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-square shadow-souk-sm hover:shadow-souk-md transition-shadow"
              >
                <Image
                  src={heroImages[cat.slug] ?? "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"}
                  alt={cat.name}
                  fill className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-display text-xl font-semibold text-white">{cat.name}</p>
                  <p className="text-stone-200 text-xs font-sans">{cat._count.products} products</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Featured Products — replaces featured-products from main.js ── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-souk-700 uppercase tracking-widest mb-1">Curated for you</p>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-stone-900">
              Featured Pieces
            </h2>
          </div>
          <Link href="/products?featured=true" className="hidden md:flex text-sm font-medium text-souk-700 hover:text-souk-800 items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-5">
          {featuredProducts.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={i < 3}
            />
          ))}
        </div>
      </section>

      {/* ── Why Souk ── */}
      <section className="bg-souk-700 py-14">
        <div className="max-w-8xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: "🧵", title: "Authentic Craftsmanship", body: "Every piece is sourced directly from artisans — no middlemen, just genuine quality." },
              { icon: "🚚", title: "Free India Delivery", body: "We deliver free across India. Orders dispatch within 24–48 hours." },
              { icon: "🔄", title: "7-Day Size Exchange", body: "Wrong size? Exchange within 7 days, no questions asked." },
            ].map(({ icon, title, body }) => (
              <div key={title} className="space-y-3">
                <div className="text-4xl">{icon}</div>
                <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
                <p className="text-souk-100 text-sm leading-relaxed font-sans">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-8xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="font-display text-3xl md:text-4xl font-medium text-stone-900 text-center mb-10">
          What Our Customers Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Aisha K.", location: "Delhi", rating: 5, text: "The Kashmiri pheran I ordered is absolutely stunning. The quality is unlike anything I've found online. Will definitely order again!" },
            { name: "Fatima R.", location: "Hyderabad", rating: 5, text: "Pakistani suit quality is amazing. Got so many compliments at Eid. The fabric is so soft and the embroidery is intricate." },
            { name: "Priya M.", location: "Mumbai", rating: 5, text: "The pashmina shawl is worth every rupee. Incredibly soft and warm. Packaging was beautiful too — felt like a real gift." },
          ].map(({ name, location, rating, text }) => (
            <div key={name} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-souk-sm">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: rating }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed mb-4 font-sans">"{text}"</p>
              <div>
                <p className="font-semibold text-stone-900 text-sm">{name}</p>
                <p className="text-xs text-stone-400">{location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
