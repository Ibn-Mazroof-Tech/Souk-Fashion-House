// ─────────────────────────────────────────────────────────────────────────────
// app/api/checkout/razorpay/create-order/route.ts
// POST — Create a Razorpay order from the backend
//
// Replaces: Math.random() fake paymentId from original checkout.js
// Real flow: Backend creates order → frontend opens Razorpay modal →
//            user pays → backend verifies signature
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { razorpayCreateSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = razorpayCreateSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );

    let { amount, couponCode } = result.data;

    // Apply coupon discount if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      // maxUses/usedCount compares two columns of the same row, which Prisma's
      // standard `where` filters can't express — check it in application code.
      const withinUsageLimit =
        !coupon || coupon.maxUses === null || coupon.usedCount < coupon.maxUses;

      if (coupon && withinUsageLimit && amount >= coupon.minOrder) {
        if (coupon.type === "percent") {
          amount = amount - Math.round((amount * coupon.value) / 100);
        } else {
          amount = Math.max(0, amount - coupon.value);
        }
      }
    }

    // Minimum Razorpay order: ₹1 = 100 paise
    if (amount < 100) {
      return NextResponse.json(
        { success: false, error: "Minimum order amount is ₹1" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    // This generates a real order ID (razorpay_order_id) that the frontend uses
    const order = await razorpay.orders.create({
      amount, // in paise
      currency: "INR",
      receipt: `sfh_${Date.now()}`,
      notes: {
        source: "Souk Fashion House",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        razorpayOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        // Send the public key ID to the frontend (safe to expose)
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("[POST /api/checkout/razorpay/create-order]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
