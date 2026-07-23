// ─────────────────────────────────────────────────────────────────────────────
// store/useUIStore.ts — Global UI State
// Manages: cart drawer open/close, mobile menu, overlays
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";

type UIStore = {
  cartOpen: boolean;
  mobileMenuOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  cartOpen: false,
  mobileMenuOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
  openMobileMenu: () => set({ mobileMenuOpen: true }),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
}));
