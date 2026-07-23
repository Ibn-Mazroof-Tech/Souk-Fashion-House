// ─────────────────────────────────────────────────────────────────────────────
// lib/validations/index.ts — All Zod Schemas
// Used in API route handlers for input validation
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ── Address ───────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().min(5, "Address too short").max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ── Cart ──────────────────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().min(1).max(10),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartSchema = z.object({
  // +1 to increment, -1 to decrement
  delta: z.number().int().refine((v) => v === 1 || v === -1, {
    message: "Delta must be +1 or -1",
  }),
});

// ── Orders ────────────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  addressId: z.string().optional(),
  // Guest checkout fields (when not authenticated)
  guestName: z.string().min(2).max(100).optional(),
  guestPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional(),
  guestEmail: z.string().email().optional(),
  guestItems: z
    .array(
      z.object({
        productId: z.string(),
        size: z.string(),
        color: z.string().optional(),
        qty: z.number().int().min(1),
      })
    )
    .optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD", "WHATSAPP"]),
  // For Razorpay: pass these after payment
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  couponCode: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ── Products (Admin) ──────────────────────────────────────────────────────────

export const productVariantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  colorHex: z.string().optional(),
  stock: z.number().int().min(0).default(0),
});

export const productColorImageSchema = z.object({
  color: z.string().min(1),
  images: z.array(z.string().url()).min(1),
});

export const productSchema = z.object({
  name: z.string().min(3, "Product name too short").max(100),
  description: z.string().max(2000).optional(),
  // Accept rupees from admin form, convert to paise in handler
  price: z.number().int().min(1, "Price must be greater than 0"),
  mrp: z.number().int().min(1),
  stock: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  images: z.array(z.string().url()).min(1, "At least one image required"),
  sizes: z.array(z.string()).min(1, "At least one size required"),
  categoryId: z.string().min(1, "Category is required"),
  // Optional — when provided, these replace simple sizes/stock with
  // per size+color stock tracking (see ProductVariant model)
  variants: z.array(productVariantSchema).optional(),
  // Optional — per-color image sets (see ProductColorImage model)
  colorImages: z.array(productColorImageSchema).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

// ── Review ────────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10, "Review too short").max(1000).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ── Razorpay Create Order ─────────────────────────────────────────────────────

export const razorpayCreateSchema = z.object({
  // Amount in paise
  amount: z.number().int().min(100, "Minimum order ₹1"),
  couponCode: z.string().optional(),
});

// ── Coupon ────────────────────────────────────────────────────────────────────

export const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().min(1),
  minOrder: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  active: z.boolean().default(true),
});
