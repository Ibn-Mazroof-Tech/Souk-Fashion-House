// ─────────────────────────────────────────────────────────────────────────────
// store/useCartStore.ts — Zustand Cart Store
//
// Replaces: cart.js localStorage logic from original project
// 
// Strategy:
//   Guest user  → cart lives here (localStorage via zustand persist)
//   Logged in   → cart synced to DB via /api/cart on login
//   On login    → call mergeCart() to push local items to DB, then clear local
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GuestCartItem } from "@/types";

type CartStore = {
  items: GuestCartItem[];

  // Actions
  addItem: (item: GuestCartItem) => void;
  removeItem: (productId: string, size: string, color?: string) => void;
  updateQty: (productId: string, size: string, delta: 1 | -1, color?: string) => void;
  clearCart: () => void;
  setItems: (items: GuestCartItem[]) => void;

  // Derived
  itemCount: () => number;
  total: () => number;
};

const sameLine = (a: { productId: string; size: string; color?: string }, b: { productId: string; size: string; color?: string }) =>
  a.productId === b.productId && a.size === b.size && (a.color ?? "") === (b.color ?? "");

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find((i) => sameLine(i, newItem));

          if (existing) {
            // Increment quantity of existing item (max 10)
            return {
              items: state.items.map((i) =>
                sameLine(i, newItem) ? { ...i, qty: Math.min(10, i.qty + newItem.qty) } : i
              ),
            };
          }

          // Add new item
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId, size, color) => {
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, { productId, size, color })),
        }));
      },

      updateQty: (productId, size, delta, color) => {
        set((state) => {
          const updated = state.items
            .map((i) =>
              sameLine(i, { productId, size, color }) ? { ...i, qty: i.qty + delta } : i
            )
            .filter((i) => i.qty > 0); // Remove items that reach 0
          return { items: updated };
        });
      },

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      // Derived: total item count (sum of all quantities)
      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      // Derived: total price in paise
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: "sfh-cart", // localStorage key (sfh = Souk Fashion House)
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);
