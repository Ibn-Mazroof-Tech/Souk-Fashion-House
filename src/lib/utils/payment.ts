// ─────────────────────────────────────────────────────────────────────────────
// lib/utils/payment.ts — Razorpay Payment Verification
//
// Replaces: Math.random() fake paymentId from original checkout.js
// Real HMAC-SHA256 verification as required by Razorpay docs
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";

/**
 * Verify Razorpay payment signature
 *
 * How it works:
 *   1. Razorpay signs the payment with: sha256(razorpayOrderId + "|" + razorpayPaymentId, secret)
 *   2. We recompute the same hash server-side
 *   3. Compare our hash with the signature Razorpay sent → if equal, payment is genuine
 *
 * This prevents fake payment confirmations — without the secret key,
 * an attacker cannot forge a valid signature.
 */
export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET not configured");

  // Razorpay spec: HMAC of "orderId|paymentId" using the secret key
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  // Use timingSafeEqual to prevent timing attacks
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(razorpaySignature, "hex");

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

/**
 * Verify Razorpay webhook signature
 * Different from payment verification — uses the webhook secret
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}
