"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/(store)/orders/track/page.tsx — Order Tracking
// Replaces: track.html + tracking.js
// Public — no auth required (orderId + phone verification)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Search, Package, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fmt } from "@/lib/utils/format";
import type { Metadata } from "next";

// Steps from original tracking.js — preserved
const ORDER_STEPS = ["ORDERED", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;
const STEP_LABELS: Record<string, string> = {
  ORDERED:   "Order Placed",
  CONFIRMED: "Confirmed",
  SHIPPED:   "Shipped",
  DELIVERED: "Delivered",
};

type TrackResult = {
  orderId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  steps: string[];
  currentStep: number;
  items: { name: string; image: string; size: string; color?: string | null; qty: number; price: number }[];
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/orders/track?orderId=${orderId.trim()}&phone=${phone.trim()}`);
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 page-enter">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-souk-50 flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 text-souk-700" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium text-stone-900 mb-2">
          Track Your Order
        </h1>
        <p className="text-stone-500 font-sans text-sm">
          Enter your Order ID and the phone number used at checkout.
        </p>
      </div>

      {/* ── Search form — replaces #track-form from tracking.js ── */}
      <form onSubmit={handleTrack} className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5 font-sans">
              Order ID
            </label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="SFH-10001"
              required
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 placeholder:text-stone-400 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5 font-sans">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile number"
              required
              maxLength={10}
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 placeholder:text-stone-400"
            />
          </div>
          <Button type="submit" loading={loading} size="lg" fullWidth className="rounded-xl mt-2">
            <Search className="w-4 h-4" /> Track Order
          </Button>
        </div>
      </form>

      {/* ── Error — replaces "Order not found" from tracking.js ── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6 text-center">
          <p className="text-red-700 text-sm font-medium mb-3 font-sans">{error}</p>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Need help tracking order ${orderId}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#25D366] hover:underline font-sans"
          >
            <MessageCircle className="w-4 h-4" /> Get support on WhatsApp
          </a>
        </div>
      )}

      {/* ── Result — replaces .progress from tracking.js ── */}
      {result && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-6 animate-slide-up">
          {/* Order header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-stone-400 font-sans uppercase tracking-wide">Order ID</p>
              <p className="font-mono font-bold text-stone-900 text-lg">{result.orderId}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full font-sans ${
              result.status === "DELIVERED" ? "bg-green-100 text-green-700" :
              result.status === "CANCELLED" ? "bg-red-100 text-red-700" :
              "bg-souk-50 text-souk-700"
            }`}>
              {result.status}
            </span>
          </div>

          {/* Progress steps — replaces .progress .step elements from tracking.js */}
          <div className="relative mb-8">
            {/* Connector line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-stone-100" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-souk-700 transition-all duration-500"
              style={{ width: `${(result.currentStep / (ORDER_STEPS.length - 1)) * 100}%`, right: "auto" }}
            />

            <div className="relative flex justify-between">
              {ORDER_STEPS.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={`step-dot ${
                    i < result.currentStep ? "completed" :
                    i === result.currentStep ? "current" : "pending"
                  }`}>
                    {i < result.currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-sans font-medium text-center max-w-[60px] ${
                    i <= result.currentStep ? "text-stone-800" : "text-stone-400"
                  }`}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order items */}
          <div className="space-y-3 border-t border-stone-100 pt-5 mb-5">
            {result.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-14 rounded-lg object-cover bg-cream-100" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900 font-sans">{item.name}</p>
                  <p className="text-xs text-stone-400 font-sans">{item.size}{item.color ? ` / ${item.color}` : ""} × {item.qty}</p>
                </div>
                <span className="text-sm font-semibold text-stone-900 font-sans">{fmt(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          {/* Total + WA */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <div>
              <p className="text-xs text-stone-400 font-sans">Order Total</p>
              <p className="font-display text-xl font-semibold text-souk-700">{fmt(result.total)}</p>
            </div>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, order update needed for ${result.orderId}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-[#25D366] hover:underline font-sans"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
