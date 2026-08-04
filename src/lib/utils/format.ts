// ─────────────────────────────────────────────────────────────────────────────
// lib/utils/format.ts — Formatting utilities
// Replaces: fmt(), discountPct(), orderId() from original utils.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format paise to INR display string
 * e.g. 299900 → "₹2,999"
 */
export function fmt(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

/**
 * Calculate discount percentage
 * e.g. { price: 299900, mrp: 399900 } → 25
 */
export function discountPct(price: number, mrp: number): number {
  return Math.round(((mrp - price) / mrp) * 100);
}

/**
 * Generate human-readable order ID
 * Preserved format from original: "SFH-XXXXX"
 */
export function generateOrderId(): string {
  return `SFH-${Math.floor(10000 + Math.random() * 90000)}`;
}

/**
 * Generate WhatsApp chat link
 * Preserved from original waLink() utility
 */
export function waLink(text: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * cn — merge Tailwind classes safely
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert rupees to paise for storage
 */
export const toPaise = (rupees: number) => Math.round(rupees * 100);

/**
 * Convert paise to rupees for display
 */
export const toRupees = (paise: number) => paise / 100;
