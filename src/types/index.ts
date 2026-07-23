// ─────────────────────────────────────────────────────────────────────────────
// types/index.ts — Shared Application Types
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Product,
  Category,
  Order,
  OrderItem,
  CartItem,
  User,
  Review,
  Coupon,
} from "@prisma/client";

// ── Re-exports with relations ─────────────────────────────────────────────────

export type ProductWithCategory = Product & {
  category: Category;
};

export type ProductWithReviews = Product & {
  category: Category;
  reviews: (Review & { user: Pick<User, "id" | "name" | "image"> })[];
  _count: { reviews: number };
};

export type OrderWithItems = Order & {
  items: OrderItem[];
  user?: Pick<User, "id" | "name" | "email"> | null;
};

export type CartItemWithProduct = CartItem & {
  product: Product;
};

// ── Cart Types (Zustand / guest cart) ────────────────────────────────────────

export type GuestCartItem = {
  productId: string;
  size: string;
  // Present only when the product uses size+color variants
  color?: string;
  colorHex?: string;
  qty: number;
  // Snapshot for display (loaded from product when adding)
  name: string;
  image: string;
  price: number; // paise
  slug: string;
};

// ── Checkout Types ────────────────────────────────────────────────────────────

export type CheckoutStep = "address" | "payment" | "confirm";

export type CheckoutAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
};

export type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

// ── API Response Types ────────────────────────────────────────────────────────

export type ApiSuccess<T = unknown> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── Admin Analytics ───────────────────────────────────────────────────────────

export type AnalyticsData = {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  codOrders: number;
  pendingOrders: number;
  topProducts: {
    productId: string;
    name: string;
    image: string;
    totalSold: number;
    revenue: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
    orders: number;
  }[];
};

// ── Coupon applied state ──────────────────────────────────────────────────────

export type AppliedCoupon = {
  code: string;
  type: "percent" | "flat";
  value: number;
  discount: number; // computed discount in paise
};
