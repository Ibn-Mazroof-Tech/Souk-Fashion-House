// ─────────────────────────────────────────────────────────────────────────────
// components/store/ProductCard.tsx
// Replaces: product card HTML template from main.js / collection.js
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { fmt, discountPct, cn } from "@/lib/utils/format";
import type { Product, Category } from "@prisma/client";

type Props = {
  product: Product & { category: Category; _count?: { reviews: number; variants?: number } };
  avgRating?: number;
  priority?: boolean;
};

export function ProductCard({ product, avgRating, priority = false }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const discount = discountPct(product.price, product.mrp);
  const defaultSize = product.sizes[0];
  const hasVariants = (product._count?.variants ?? 0) > 0;
  const needsSelection = hasVariants || product.sizes.length > 1;

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (needsSelection) {
      // Navigate to product page for size/color selection
      window.location.href = `/products/${product.slug}`;
      return;
    }

    setAddingToCart(true);
    // Add to local cart (Zustand)
    addItem({
      productId: product.id,
      size: defaultSize,
      qty: 1,
      name: product.name,
      image: product.images[0] ?? "",
      price: product.price,
      slug: product.slug,
    });
    toast.success("Added to cart", {
      description: `${product.name} · ${defaultSize}`,
      action: { label: "View Cart", onClick: () => {} },
    });
    setAddingToCart(false);
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((v) => !v);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="product-card group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-souk-200 hover:shadow-souk-md transition-all duration-300"
    >
      {/* ── Image container ── */}
      <div className="relative overflow-hidden aspect-[3/4] bg-cream-100">
        <Image
          src={product.images[0] ?? "https://images.unsplash.com/photo-1445205170230-053b83016050?w=700"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover product-card-img"
          priority={priority}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount >= 10 && (
            <Badge variant="discount">{discount}% off</Badge>
          )}
          {product.featured && (
            <Badge variant="featured">⭐ Featured</Badge>
          )}
          {product.stock < 5 && product.stock > 0 && (
            <Badge variant="warning">Only {product.stock} left</Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="error">Out of Stock</Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full",
            "flex items-center justify-center transition-all duration-200",
            "opacity-0 group-hover:opacity-100 shadow-sm",
            wishlisted
              ? "bg-souk-700 text-white"
              : "bg-white/90 text-stone-600 hover:bg-souk-50 hover:text-souk-700"
          )}
          aria-label="Add to wishlist"
        >
          <Heart className={cn("w-4 h-4", wishlisted && "fill-current")} />
        </button>

        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-3">
          <Button
            onClick={handleQuickAdd}
            loading={addingToCart}
            disabled={product.stock === 0}
            size="sm"
            className="w-full bg-souk-700/95 backdrop-blur-sm text-white hover:bg-souk-800 rounded-xl text-xs font-medium"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {needsSelection ? "Select Options" : "Add to Cart"}
          </Button>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-3.5 flex flex-col gap-1 flex-1">
        {/* Category */}
        <span className="text-[11px] text-souk-700 font-semibold uppercase tracking-wider font-sans">
          {product.category.name}
        </span>

        {/* Name */}
        <h3 className="font-display text-base font-medium text-stone-900 leading-snug line-clamp-2 group-hover:text-souk-800 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {avgRating !== undefined && (product._count?.reviews ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-stone-200 text-stone-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-stone-500 font-sans">
              ({product._count?.reviews})
            </span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="font-display text-lg font-semibold text-stone-900">
            {fmt(product.price)}
          </span>
          {product.mrp > product.price && (
            <span className="text-sm text-stone-400 line-through font-sans">
              {fmt(product.mrp)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
