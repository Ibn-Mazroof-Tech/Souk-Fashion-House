// ─────────────────────────────────────────────────────────────────────────────
// app/(store)/orders/[id]/page.tsx — Order Confirmation Page
// Replaces: thanks() function from checkout.js
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle, Package, Truck, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Confirmed" };

export default function OrderConfirmPage({ params }: { params: { id: string } }) {
  const orderId = params.id;
  const wa = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999"}?text=${encodeURIComponent(`Hi, follow-up for order ${orderId}`)}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center page-enter">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>

      <h1 className="font-display text-3xl md:text-4xl font-medium text-stone-900 mb-3">
        Order Placed!
      </h1>
      <p className="text-stone-500 font-sans mb-2">Thank you for shopping with Souk Fashion House.</p>
      <div className="inline-flex items-center gap-2 bg-souk-50 border border-souk-100 rounded-full px-4 py-2 mb-8">
        <Package className="w-4 h-4 text-souk-700" />
        <span className="text-sm font-semibold text-souk-700 font-sans">Order ID: {orderId}</span>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-6 mb-6 text-left space-y-4">
        {[
          { icon: Truck, title: "Dispatches in 24–48 hours", desc: "We'll pack your order carefully and ship it soon." },
          { icon: Package, title: "Track your order", desc: "Use your Order ID and phone number to track delivery." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-souk-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="w-4.5 h-4.5 text-souk-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 font-sans">{title}</p>
              <p className="text-xs text-stone-500 font-sans mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/orders/track"
          className="btn-souk px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 justify-center">
          Track Order
        </Link>
        <a href={wa} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors justify-center font-sans">
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          WhatsApp Follow-up
        </a>
        <Link href="/products"
          className="px-6 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors inline-flex items-center justify-center font-sans">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
