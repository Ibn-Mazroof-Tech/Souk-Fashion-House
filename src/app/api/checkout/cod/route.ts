// ─────────────────────────────────────────────────────────────────────────────
// app/api/checkout/cod/route.ts
// POST — Create a Cash on Delivery order
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderId } from "@/lib/utils/format";
import { resolveCartItems, decrementStockOrThrow, CheckoutError } from "@/lib/checkout/resolveCartItems";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { addressId, guestName, guestPhone, guestEmail, guestItems, couponCode } = body;

    if (!session?.user && (!guestName || !guestPhone))
      return NextResponse.json({ success: false, error: "Name and phone required for guest checkout" }, { status: 400 });

    // Cart lives client-side (Zustand) for both guest and logged-in users, so
    // the frontend always sends the current items here — this is the source
    // of truth, not the (unused) DB CartItem table.
    const cartItems: { productId: string; size: string; color?: string; qty: number }[] = guestItems ?? [];

    const { resolved, total: itemsTotal } = await resolveCartItems(cartItems);
    let total = itemsTotal;

    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), active: true },
      });
      if (coupon && total >= coupon.minOrder) {
        couponDiscount =
          coupon.type === "percent"
            ? Math.round((total * coupon.value) / 100)
            : coupon.value;
        total = Math.max(0, total - couponDiscount);
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const orderId = generateOrderId();

    const order = await prisma.$transaction(async (tx) => {
      await decrementStockOrThrow(tx, resolved);

      const newOrder = await tx.order.create({
        data: {
          orderId,
          userId: session?.user?.id,
          guestName,
          guestPhone,
          guestEmail,
          status: "ORDERED",
          paymentMethod: "COD",
          paymentStatus: "PENDING",
          total,
          couponCode,
          couponDiscount,
          addressId,
          items: {
            create: resolved.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              name: line.name,
              image: line.image,
              size: line.size,
              color: line.color,
              qty: line.qty,
              price: line.price,
            })),
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: total,
          currency: "INR",
          status: "PENDING",
        },
      });

      return newOrder;
    });

    // Clear cart
    if (session?.user) {
      await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    }

    return NextResponse.json({
      success: true,
      data: { orderId: order.orderId, id: order.id },
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("[POST /api/checkout/cod]", error);
    return NextResponse.json({ success: false, error: "Order creation failed" }, { status: 500 });
  }
}
