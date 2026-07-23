// ─────────────────────────────────────────────────────────────────────────────
// app/api/checkout/razorpay/verify/route.ts
// POST — Verify Razorpay signature & create Order in DB
//
// Called AFTER user completes payment in Razorpay modal
// This is the critical security step — without HMAC verification,
// a bad actor could send fake payment confirmations
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/utils/payment";
import { generateOrderId } from "@/lib/utils/format";
import { createOrderSchema } from "@/lib/validations";
import { resolveCartItems, decrementStockOrThrow, CheckoutError } from "@/lib/checkout/resolveCartItems";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const result = createOrderSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );

    const {
      addressId,
      guestName,
      guestPhone,
      guestEmail,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      couponCode,
    } = result.data;

    // ── 1. Verify Razorpay signature (HMAC-SHA256) ─────────────────────────
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      console.error("[verify] Invalid Razorpay signature — possible tampered payment");
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // ── 2. Resolve cart items — cart lives client-side (Zustand) for both
    //       guest and logged-in users, so the frontend always sends current
    //       items here. Validates size/color availability and stock.
    const cartItems: { productId: string; size: string; color?: string; qty: number }[] =
      body.guestItems ?? [];

    const { resolved, total: itemsTotal } = await resolveCartItems(cartItems);
    let total = itemsTotal;

    // Apply coupon
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
        // Increment coupon usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // ── 3. Create Order + OrderItems + Payment in a transaction ────────────
    // Payment is already captured by Razorpay at this point, so stock is only
    // re-checked here to keep records accurate — a failure here is logged
    // clearly since the customer has already paid.
    const orderId = generateOrderId();

    const order = await prisma.$transaction(async (tx) => {
      await decrementStockOrThrow(tx, resolved);

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderId,
          userId: session?.user?.id,
          guestName,
          guestPhone,
          guestEmail,
          status: "ORDERED",
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
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
              price: line.price, // snapshot at order time
            })),
          },
        },
      });

      // Create Payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          amount: total,
          currency: "INR",
          status: "PAID",
        },
      });

      return newOrder;
    });

    // ── 4. Clear cart post-order ────────────────────────────────────────────
    if (session?.user) {
      await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    }

    return NextResponse.json({
      success: true,
      data: { orderId: order.orderId, id: order.id },
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      // Payment was already captured — log loudly so this can be manually
      // reconciled/refunded; the customer still needs a clear message.
      console.error("[POST /api/checkout/razorpay/verify] Stock issue after payment capture:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("[POST /api/checkout/razorpay/verify]", error);
    return NextResponse.json(
      { success: false, error: "Order creation failed" },
      { status: 500 }
    );
  }
}
