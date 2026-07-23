// ─────────────────────────────────────────────────────────────────────────────
// app/(store)/wishlist/page.tsx — Wishlist Page
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProductCard } from "@/components/store/ProductCard";
import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Wishlist" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/wishlist");

  const wishlist = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          category: true,
          _count: { select: { reviews: true, variants: true } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  const products = wishlist.map((w) => w.product).filter((p) => p.active);

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 py-10 page-enter">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-6 h-6 text-souk-700" />
        <h1 className="font-display text-3xl md:text-4xl font-medium text-stone-900">
          My Wishlist
        </h1>
        <span className="text-stone-400 font-sans text-base font-normal">
          ({products.length} item{products.length !== 1 ? "s" : ""})
        </span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-souk-50 flex items-center justify-center mx-auto mb-5">
            <Heart className="w-7 h-7 text-souk-700" />
          </div>
          <p className="font-display text-2xl font-medium text-stone-900 mb-2">
            Your wishlist is empty
          </p>
          <p className="text-stone-500 text-sm font-sans mb-6">
            Save items you love — they'll appear here.
          </p>
          <Link href="/products"
            className="btn-souk inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
            Explore Collections <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
