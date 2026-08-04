// ─────────────────────────────────────────────────────────────────────────────
// app/api/orders/track/route.ts
// GET /api/orders/track?orderId=SFH-10001&phone=9999999999
//
// Public route — no authentication required
// Preserved from original tracking.js: orderId + phone verification
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const orderId = searchParams.get("orderId")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!orderId || !phone) {
      return NextResponse.json(
        { success: false, error: "Order ID and phone number are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        orderId,
        OR: [
          // Authenticated order: match phone from user's address
          { user: { phone } },
          // Guest order: match guestPhone directly
          { guestPhone: phone },
        ],
      },
      select: {
        orderId: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            name: true,
            image: true,
            size: true,
            color: true,
            qty: true,
            price: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found. Please check your Order ID and phone number.",
        },
        { status: 404 }
      );
    }

    // Map status to progress steps (preserved from original tracking.js)
    const steps = ["ORDERED", "CONFIRMED", "SHIPPED", "DELIVERED"];
    const currentStep = steps.indexOf(order.status);

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        steps,
        currentStep: Math.max(0, currentStep),
      },
    });
  } catch (error) {
    console.error("[GET /api/orders/track]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
