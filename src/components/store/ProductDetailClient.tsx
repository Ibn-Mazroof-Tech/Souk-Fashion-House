"use client";
// ─────────────────────────────────────────────────────────────────────────────
// components/store/ProductDetailClient.tsx
// Full right-column-and-gallery experience for the product page. Combined
// into one client component because the gallery needs to react to the
// selected color, and that selection lives in the size/color picker below it
// — they need to share state, so they can't be split into server + client
// siblings.
//
// Two modes:
//   - Variant mode (product.variants.length > 0): per size+color stock,
//     gallery swaps per color if that color has its own uploaded photos
//   - Legacy mode (no variants): simple size list + single product.stock,
//     gallery is just product.images
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ShoppingBag, Heart, MessageCircle, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { cn, fmt, discountPct } from "@/lib/utils/format";

type Variant = {
  id: string;
  size: string;
  color: string;
  colorHex: string | null;
  stock: number;
};

type ColorImageSet = { color: string; images: string[] };

type ProductSnap = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  images: string[];
  sizes: string[];
  stock: number;
  variants?: Variant[];
  colorImages?: ColorImageSet[];
};

type Props = {
  product: ProductSnap;
  waInquiry: string;
  categoryName: string;
  categorySlug: string;
  avgRating: number | null;
  reviewCount: number;
  description: string;
};

export function ProductDetailClient({
  product, waInquiry, categoryName, categorySlug, avgRating, reviewCount, description,
}: Props) {
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const variants = product.variants ?? [];
  const colorImages = product.colorImages ?? [];

  // ── Derived variant lookups ──────────────────────────────────────────────
  const colors = useMemo(() => {
    const seen = new Map<string, string | null>();
    for (const v of variants) if (!seen.has(v.color)) seen.set(v.color, v.colorHex);
    return Array.from(seen.entries()).map(([color, colorHex]) => ({ color, colorHex }));
  }, [variants]);

  const allSizes = useMemo(() => {
    const seen = new Set<string>();
    for (const v of variants) seen.add(v.size);
    return Array.from(seen);
  }, [variants]);

  const [selectedColor, setSelectedColor] = useState(colors[0]?.color ?? "");
  const [selectedSize, setSelectedSize] = useState(
    hasVariants ? allSizes[0] ?? "" : product.sizes[0] ?? "Free"
  );
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  // ── Gallery — swap to the selected color's photos if it has any ─────────
  const galleryImages = useMemo(() => {
    if (hasVariants && selectedColor) {
      const set = colorImages.find((ci) => ci.color === selectedColor);
      if (set && set.images.length > 0) return set.images;
    }
    return product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1445205170230-053b83016050?w=700"];
  }, [hasVariants, selectedColor, colorImages, product.images]);

  const discount = discountPct(product.price, product.mrp);

  const stockFor = (size: string, color: string) =>
    variants.find((v) => v.size === size && v.color === color)?.stock ?? 0;

  const selectedVariant = hasVariants
    ? variants.find((v) => v.size === selectedSize && v.color === selectedColor)
    : undefined;

  const availableStock = hasVariants ? selectedVariant?.stock ?? 0 : product.stock;
  const outOfStock = hasVariants ? !selectedVariant || availableStock === 0 : product.stock === 0;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setActiveImg(0);
    // If the currently selected size isn't available for this color, jump to
    // the first size that is (mirrors common Shopify-style behaviour)
    const stillAvailable = variants.find((v) => v.size === selectedSize && v.color === color && v.stock > 0);
    if (!stillAvailable) {
      const firstAvailable = allSizes.find(
        (s) => (variants.find((v) => v.size === s && v.color === color)?.stock ?? 0) > 0
      );
      if (firstAvailable) setSelectedSize(firstAvailable);
    }
  };

  const handleAddToCart = () => {
    if (outOfStock) {
      toast.error("This item is out of stock");
      return;
    }
    if (hasVariants && !selectedVariant) {
      toast.error("Please select an available size/color combination");
      return;
    }

    const selectedColorHex = colors.find((c) => c.color === selectedColor)?.colorHex ?? undefined;

    addItem({
      productId: product.id,
      size: selectedSize,
      color: hasVariants ? selectedColor : undefined,
      colorHex: hasVariants ? selectedColorHex : undefined,
      qty,
      name: product.name,
      image: galleryImages[0] ?? "",
      price: product.price,
      slug: product.slug,
    });
    toast.success(
      `Added to cart — ${product.name} (${selectedSize}${hasVariants ? `, ${selectedColor}` : ""})`
    );
    openCart();
  };

  return (
    <>
      {/* ── Left: Gallery ── */}
      <div>
        <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-cream-100 shadow-souk-md">
          <Image
            src={galleryImages[activeImg] ?? galleryImages[0]}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {discount > 0 && (
            <div className="absolute top-4 left-4">
              <span className="bg-souk-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {discount}% OFF
              </span>
            </div>
          )}
          {!outOfStock && availableStock <= 5 && (
            <div className="absolute top-4 right-4">
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                Only {availableStock} left
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail strip — only when this color has more than one photo */}
        {galleryImages.length > 1 && (
          <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
            {galleryImages.map((url, i) => (
              <button
                key={url + i}
                onClick={() => setActiveImg(i)}
                className={cn(
                  "relative w-16 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                  activeImg === i ? "border-souk-700" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image src={url} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Details ── */}
      <div className="space-y-6">
        <a
          href={`/products?category=${categorySlug}`}
          className="inline-block text-xs font-semibold text-souk-700 uppercase tracking-widest hover:text-souk-800"
        >
          {categoryName}
        </a>

        <h1 className="font-display text-3xl md:text-4xl font-medium text-stone-900 leading-tight">
          {product.name}
        </h1>

        {avgRating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-amber-400" : "text-stone-200"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-stone-500 font-sans">
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-semibold text-stone-900">
            {fmt(product.price)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-lg text-stone-400 line-through font-sans">{fmt(product.mrp)}</span>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Save {discount}%
              </span>
            </>
          )}
        </div>

        {/* ── Color picker (variant mode only) ── */}
        {hasVariants && colors.length > 0 && (
          <div>
            <p className="text-sm font-medium text-stone-700 mb-2.5 font-sans">
              Color: <span className="font-semibold text-stone-900">{selectedColor}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colors.map(({ color, colorHex }) => {
                const active = selectedColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    aria-label={color}
                    title={color}
                    className={cn(
                      "relative w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all",
                      active ? "border-souk-700 shadow-souk-sm" : "border-stone-200 hover:border-stone-300"
                    )}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: colorHex ?? "#d6d3d1" }}
                    />
                    {active && (
                      <Check className="w-3 h-3 text-white absolute drop-shadow-[0_0_1.5px_rgba(0,0,0,0.7)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Size picker ── */}
        {hasVariants ? (
          allSizes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2.5 font-sans">
                Size: <span className="font-semibold text-stone-900">{selectedSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((size) => {
                  const stock = stockFor(size, selectedColor);
                  const disabled = stock === 0;
                  return (
                    <button
                      key={size}
                      onClick={() => !disabled && setSelectedSize(size)}
                      disabled={disabled}
                      className={cn(
                        "min-w-[44px] h-11 px-3.5 rounded-xl border text-sm font-medium font-sans transition-all relative",
                        disabled
                          ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed line-through"
                          : selectedSize === size
                          ? "bg-souk-700 text-white border-souk-700 shadow-souk-sm"
                          : "bg-white text-stone-700 border-stone-200 hover:border-souk-400"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ) : product.sizes.length > 1 || product.sizes[0] !== "Free" ? (
          <div>
            <p className="text-sm font-medium text-stone-700 mb-2.5 font-sans">
              Size: <span className="font-semibold text-stone-900">{selectedSize}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "min-w-[44px] h-11 px-3.5 rounded-xl border text-sm font-medium font-sans transition-all",
                    selectedSize === size
                      ? "bg-souk-700 text-white border-souk-700 shadow-souk-sm"
                      : "bg-white text-stone-700 border-stone-200 hover:border-souk-400"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Qty picker ── */}
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2.5 font-sans">Quantity</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-stone-900 font-sans">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {!outOfStock ? (
              <span className="text-xs text-stone-400 font-sans">{availableStock} in stock</span>
            ) : (
              <span className="text-xs text-red-500 font-semibold font-sans">Out of stock</span>
            )}
          </div>
        </div>

        {/* ── CTA buttons ── */}
        <div className="flex gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={outOfStock}
            size="lg"
            fullWidth
            className="rounded-xl"
          >
            <ShoppingBag className="w-4 h-4" />
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-xl border border-stone-200 hover:border-souk-300 flex-shrink-0 w-12"
            aria-label="Add to wishlist"
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>

        <a
          href={waInquiry}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors font-sans"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          WhatsApp Inquiry
        </a>

        {/* ── Description + accordion ── */}
        <div className="border-t border-stone-100 pt-6 space-y-1">
          {[
            { title: "Description", content: description },
            { title: "Delivery", content: "Dispatch within 24–48 hours. Delivery across India in 3–7 business days." },
            { title: "Returns & Exchange", content: "7-day size exchange on all orders. Please retain original packaging." },
            { title: "Size Guide", content: "Choose your regular fit. For custom measurements, contact us on WhatsApp before ordering." },
          ].map(({ title, content }) => (
            <details key={title} className="border-b border-stone-100 group">
              <summary className="py-3.5 flex items-center justify-between cursor-pointer list-none">
                <span className="font-sans font-medium text-stone-800 text-sm">{title}</span>
                <span className="text-souk-700 transition-transform group-open:rotate-45 text-lg leading-none">+</span>
              </summary>
              <p className="pb-4 text-sm text-stone-500 leading-relaxed font-sans">{content}</p>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
