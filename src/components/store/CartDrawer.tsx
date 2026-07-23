// ─────────────────────────────────────────────────────────────────────────────
// components/store/CartDrawer.tsx
// Replaces: cart.html logic + checkout modal from checkout.js
// Slide-in drawer from the right with full cart management
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useCartStore } from "@/store/useCartStore";
import { fmt, waLink } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const { cartOpen, closeCart } = useUIStore();
  const { items, removeItem, updateQty, itemCount, total } = useCartStore();

  if (!cartOpen) return null;

  const cartTotal = total();
  const waText = `Hi, I need cart inquiry support. Items: ${items.map((i) => `${i.name} (${i.size} x${i.qty})`).join(", ")}`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-souk-700" />
            <h2 className="font-display text-xl font-medium text-stone-900">Your Cart</h2>
            {itemCount() > 0 && (
              <span className="bg-souk-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount()}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-cream-100 flex items-center justify-center">
                <ShoppingBag className="w-9 h-9 text-stone-300" />
              </div>
              <div>
                <p className="font-display text-xl font-medium text-stone-900">Your cart is empty</p>
                <p className="text-sm text-stone-500 mt-1">Discover our beautiful ethnic collection</p>
              </div>
              <Button variant="primary" size="md" onClick={closeCart} asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-stone-50 px-5">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}-${item.color ?? ""}`} className="py-4 flex gap-3">
                  {/* Image */}
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium text-stone-900 hover:text-souk-700 transition-colors leading-snug line-clamp-2"
                      onClick={closeCart}
                    >
                      {item.name}
                    </Link>
                    <span className="text-xs text-stone-500 bg-stone-50 rounded-md px-2 py-0.5 w-fit border border-stone-100 flex items-center gap-1.5">
                      Size: {item.size}
                      {item.color && (
                        <>
                          <span className="text-stone-300">·</span>
                          {item.colorHex && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-stone-200 inline-block"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          {item.color}
                        </>
                      )}
                    </span>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      {/* Qty controls — replaces updateQty from cart.js */}
                      <div className="flex items-center gap-1 border border-stone-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(item.productId, item.size, -1, item.color)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-stone-50 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-stone-600" />
                        </button>
                        <span className="w-7 text-center text-sm font-medium text-stone-900">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, item.size, 1, item.color)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-stone-50 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-stone-600" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="font-display text-base font-semibold text-stone-900">
                        {fmt(item.price * item.qty)}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId, item.size, item.color)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 self-start mt-0.5"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-5 space-y-4 bg-white">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-stone-600">
                <span>{itemCount()} items</span>
                <span>{fmt(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-500">
                <span>Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="h-px bg-stone-100" />
              <div className="flex justify-between">
                <span className="font-display text-lg font-semibold text-stone-900">Total</span>
                <span className="font-display text-xl font-semibold text-souk-700">
                  {fmt(cartTotal)}
                </span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="space-y-2.5">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-souk w-full h-11 text-sm rounded-xl flex items-center justify-center"
              >
                Proceed to Checkout
              </Link>

              {/* WhatsApp inquiry — preserved from original */}
              <a
                href={waLink(waText)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                WhatsApp Inquiry
              </a>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
