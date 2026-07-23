"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/(store)/cart/page.tsx — Cart Page
// Replaces: cart.html + checkout.js (cart rendering part)
// ─────────────────────────────────────────────────────────────────────────────

import { useCartStore } from "@/store/useCartStore";
import { fmt, waLink } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCartStore();
  const router = useRouter();
  const cartTotal = total();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center page-enter">
        <div className="w-20 h-20 rounded-full bg-souk-50 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-9 h-9 text-souk-700" />
        </div>
        <h1 className="font-display text-3xl font-medium text-stone-900 mb-3">Your cart is empty</h1>
        <p className="text-stone-500 text-sm mb-8 font-sans">Add some beautiful pieces to get started.</p>
        <Link href="/products">
          <Button size="lg" className="rounded-xl px-8">
            Browse Collections <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const wa = waLink(`Hi, I need help with my cart. Items: ${items.map((i) => `${i.name} (${i.size} x${i.qty})`).join(", ")}`);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 page-enter">
      <h1 className="font-display text-3xl md:text-4xl font-medium text-stone-900 mb-8">
        Shopping Cart
        <span className="ml-3 font-sans text-base font-normal text-stone-400">
          ({items.reduce((s, i) => s + i.qty, 0)} item{items.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Cart items ── */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, idx) => (
            <div
              key={`${item.productId}-${item.size}-${item.color ?? ""}`}
              className="flex gap-4 bg-white rounded-2xl p-4 border border-stone-100 shadow-souk-sm animate-slide-up"
            >
              {/* Image */}
              <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-cream-100">
                  <Image
                    src={item.image || "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`}>
                  <h3 className="font-display text-base font-medium text-stone-900 hover:text-souk-700 transition-colors truncate">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-sm text-stone-500 font-sans mt-0.5 flex items-center gap-1.5">
                  Size: <span className="font-medium text-stone-700">{item.size}</span>
                  {item.color && (
                    <>
                      <span className="text-stone-300">·</span>
                      {item.colorHex && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-stone-200 inline-block"
                          style={{ backgroundColor: item.colorHex }}
                        />
                      )}
                      <span className="font-medium text-stone-700">{item.color}</span>
                    </>
                  )}
                </p>
                <p className="text-sm font-semibold text-souk-700 font-sans mt-1">
                  {fmt(item.price)}
                </p>
              </div>

              {/* Qty + Remove */}
              <div className="flex flex-col items-end justify-between gap-2">
                {/* Qty controls */}
                <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQty(item.productId, item.size, -1, item.color)}
                    className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-stone-900 font-sans">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.productId, item.size, 1, item.color)}
                    className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal */}
                <p className="text-sm font-semibold text-stone-900 font-sans">
                  {fmt(item.price * item.qty)}
                </p>

                {/* Remove */}
                <button
                  onClick={() => {
                    removeItem(item.productId, item.size, item.color);
                    toast.success("Item removed");
                  }}
                  className="text-stone-300 hover:text-red-500 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* WhatsApp cart inquiry — preserved from original */}
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors font-sans"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            Need help? Chat on WhatsApp
          </a>
        </div>

        {/* ── Order summary ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-6 sticky top-24">
            <h2 className="font-display text-xl font-medium text-stone-900 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{fmt(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-stone-100 pt-3 flex justify-between font-semibold text-stone-900 text-base">
                <span>Total</span>
                <span className="text-souk-700 font-display text-lg">{fmt(cartTotal)}</span>
              </div>
            </div>

            <Button
              onClick={() => router.push("/checkout")}
              size="lg"
              fullWidth
              className="mt-6 rounded-xl"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Button>

            <Link href="/products">
              <Button variant="ghost" size="md" fullWidth className="mt-2 rounded-xl">
                Continue Shopping
              </Button>
            </Link>

            {/* Trust badge */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-400 font-sans">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure checkout — Razorpay encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
