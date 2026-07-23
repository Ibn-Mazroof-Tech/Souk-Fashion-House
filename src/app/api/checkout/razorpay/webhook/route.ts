// ─────────────────────────────────────────────────────────────────────────────
// app/api/checkout/razorpay/webhook/route.ts
// POST — Razorpay webhook handler
//
// Razorpay sends payment events here for server-side confirmation.
// IMPORTANT: Must read raw body (not JSON parsed) for HMAC verification.
// Configure in Razorpay Dashboard → Settings → Webhooks
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/utils/payment";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Read raw body for HMAC verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error("[webhook] Missing signature or webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify webhook authenticity
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("[webhook] Invalid signature — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event;

    console.log(`[webhook] Event received: ${eventType}`);

    // Handle payment.captured — payment successfully completed
    if (eventType === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: payment.order_id },
          data: {
            status: "PAID",
            razorpayPaymentId: payment.id,
          },
        });
        // Also update the parent order
        const dbPayment = await prisma.payment.findFirst({
          where: { razorpayOrderId: payment.order_id },
          select: { orderId: true },
        });
        if (dbPayment) {
          await prisma.order.update({
            where: { id: dbPayment.orderId },
            data: { paymentStatus: "PAID", status: "CONFIRMED" },
          });
        }
        console.log(`[webhook] Payment captured: ${payment.order_id}`);
      }
    }

    // Handle payment.failed
    if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: payment.order_id },
          data: { status: "FAILED" },
        });
        console.log(`[webhook] Payment failed: ${payment.order_id}`);
      }
    }

    // Acknowledge receipt — Razorpay retries if we don't return 200
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Note: App Router route handlers never auto-parse the body, so raw body
// (via req.text() above) is already available without any extra config.
// The old Pages Router `export const config = { api: { bodyParser: false } }`
// is deprecated/invalid here and was causing the Vercel build to fail.
