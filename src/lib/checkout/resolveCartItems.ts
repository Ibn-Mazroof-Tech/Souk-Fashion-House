// ─────────────────────────────────────────────────────────────────────────────
// lib/checkout/resolveCartItems.ts
// Shared by /api/checkout/cod and /api/checkout/razorpay/verify.
//
// Resolves raw cart lines (productId + size + optional color + qty) into
// order-item-ready data, validating that variant/legacy stock is available.
// Stock is actually decremented later, atomically, inside the order's
// transaction via decrementStockOrThrow — this function only reads.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export class CheckoutError extends Error {}

export type CartLine = { productId: string; size: string; color?: string; qty: number };

export type ResolvedLine = {
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  size: string;
  color?: string;
  qty: number;
  price: number; // paise, product price at order time
};

export async function resolveCartItems(cartItems: CartLine[]) {
  if (cartItems.length === 0) throw new CheckoutError("Cart is empty");

  const products = await prisma.product.findMany({
    where: { id: { in: cartItems.map((i) => i.productId) } },
    include: { variants: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const resolved: ResolvedLine[] = [];
  let total = 0;

  for (const item of cartItems) {
    const product = productMap[item.productId];
    if (!product) {
      throw new CheckoutError("One of the items in your cart is no longer available");
    }

    if (product.variants.length > 0) {
      const variant = product.variants.find(
        (v) => v.size === item.size && v.color === item.color
      );
      if (!variant) {
        throw new CheckoutError(`${product.name}: selected size/color is no longer available`);
      }
      if (variant.stock < item.qty) {
        throw new CheckoutError(
          `${product.name} (${item.size}${item.color ? `, ${item.color}` : ""}) — only ${variant.stock} left in stock`
        );
      }
      resolved.push({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        image: product.images[0] ?? "",
        size: item.size,
        color: item.color,
        qty: item.qty,
        price: product.price,
      });
    } else {
      if (product.stock < item.qty) {
        throw new CheckoutError(`${product.name} — only ${product.stock} left in stock`);
      }
      resolved.push({
        productId: product.id,
        name: product.name,
        image: product.images[0] ?? "",
        size: item.size,
        qty: item.qty,
        price: product.price,
      });
    }

    total += product.price * item.qty;
  }

  return { resolved, total };
}

// Decrements stock atomically inside the order transaction. Uses a
// conditional updateMany (`stock >= qty`) so two concurrent checkouts can
// never both succeed for the last unit — if the guard fails, the whole
// order transaction is rolled back and the customer sees a clear error
// instead of an oversold order.
export async function decrementStockOrThrow(tx: Prisma.TransactionClient, resolved: ResolvedLine[]) {
  for (const line of resolved) {
    if (line.variantId) {
      const result = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.qty } },
        data: { stock: { decrement: line.qty } },
      });
      if (result.count === 0) {
        throw new CheckoutError(
          `${line.name} (${line.size}${line.color ? `, ${line.color}` : ""}) just went out of stock`
        );
      }
      // Keep the product's aggregate stock field in sync for badges/legacy reads
      await tx.product.update({
        where: { id: line.productId },
        data: { stock: { decrement: line.qty } },
      });
    } else {
      const result = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.qty } },
        data: { stock: { decrement: line.qty } },
      });
      if (result.count === 0) {
        throw new CheckoutError(`${line.name} just went out of stock`);
      }
    }
  }
}
