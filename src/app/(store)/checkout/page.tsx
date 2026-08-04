"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/(store)/checkout/page.tsx — Multi-Step Checkout
// Replaces: openCheckout() modal from checkout.js
// Steps: Address → Payment → Confirm
// Handles real Razorpay + COD
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CheckCircle, ChevronRight, Lock, Truck, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { fmt } from "@/lib/utils/format";
import type { RazorpayResponse, CheckoutAddress } from "@/types";

type Step = "address" | "payment" | "confirm";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, total, clearCart } = useCartStore();
  const cartTotal = total();

  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState<CheckoutAddress>({
    name: session?.user?.name ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ discount: number; code: string } | null>(null);

  const finalTotal = couponApplied ? Math.max(0, cartTotal - couponApplied.discount) : cartTotal;

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null;
  }

  // ── Coupon validation ────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode}&amount=${cartTotal}`);
      const data = await res.json();
      if (data.success) {
        setCouponApplied({ discount: data.data.discount, code: couponCode });
        toast.success(`Coupon applied — ${fmt(data.data.discount)} off!`);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Could not validate coupon");
    }
  };

  // ── Razorpay payment ─────────────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay SDK failed to load");

      // 1. Create Razorpay order on backend
      const orderRes = await fetch("/api/checkout/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalTotal,
          couponCode: couponApplied?.code,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error);

      // 2. Open Razorpay modal
      const options = {
        key: orderData.data.keyId,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: "Souk Fashion House",
        description: `Order for ${items.length} item(s)`,
        order_id: orderData.data.razorpayOrderId,
        prefill: {
          name: address.name,
          contact: address.phone,
          email: session?.user?.email ?? "",
        },
        theme: { color: "#8b3d3d" },
        handler: async (response: RazorpayResponse) => {
          // 3. Verify signature on backend
          const verifyRes = await fetch("/api/checkout/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: "RAZORPAY",
              couponCode: couponApplied?.code,
              guestName: address.name,
              guestPhone: address.phone,
              guestItems: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, qty: i.qty })),
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            clearCart();
            router.push(`/orders/${verifyData.data.orderId}`);
          } else {
            toast.error("Payment verification failed. Contact support.");
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      new window.Razorpay(options).open();
    } catch (err: any) {
      toast.error(err.message ?? "Payment failed");
      setLoading(false);
    }
  };

  // ── COD order ────────────────────────────────────────────────────────────
  const handleCODOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "COD",
          couponCode: couponApplied?.code,
          guestName: address.name,
          guestPhone: address.phone,
          guestEmail: session?.user?.email ?? "",
          guestItems: items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        clearCart();
        router.push(`/orders/${data.data.orderId}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Order failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === "RAZORPAY") handleRazorpayPayment();
    else handleCODOrder();
  };

  // ── Address form ─────────────────────────────────────────────────────────
  const isAddressValid =
    address.name && address.phone.match(/^[6-9]\d{9}$/) &&
    address.line1 && address.city && address.state &&
    address.pincode.match(/^\d{6}$/);

  const inputCls = "w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 focus:border-transparent placeholder:text-stone-400 bg-white";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 page-enter">
      <h1 className="font-display text-3xl md:text-4xl font-medium text-stone-900 mb-8">Checkout</h1>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-2 mb-8 font-sans text-sm">
        {(["address", "payment", "confirm"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-4 h-4 text-stone-300" />}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
              step === s ? "bg-souk-700 text-white" :
              (["address", "payment", "confirm"].indexOf(step) > i) ? "bg-green-100 text-green-700" :
              "bg-stone-100 text-stone-400"
            }`}>
              {(["address", "payment", "confirm"].indexOf(step) > i) && (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span className="capitalize font-medium">{s}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* STEP 1: Address */}
          {step === "address" && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-6">
              <h2 className="font-display text-xl font-medium text-stone-900 mb-5 flex items-center gap-2">
                <Truck className="w-5 h-5 text-souk-700" /> Delivery Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5">Full Name *</label>
                  <input className={inputCls} placeholder="Your full name" value={address.name}
                    onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5">Phone *</label>
                  <input className={inputCls} placeholder="10-digit mobile number" value={address.phone} maxLength={10}
                    onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, "") }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5">PIN Code *</label>
                  <input className={inputCls} placeholder="6-digit PIN code" value={address.pincode} maxLength={6}
                    onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "") }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5">Address Line 1 *</label>
                  <input className={inputCls} placeholder="House no., street, area" value={address.line1}
                    onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5">Address Line 2 (Optional)</label>
                  <input className={inputCls} placeholder="Landmark, colony" value={address.line2}
                    onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5">City *</label>
                  <input className={inputCls} placeholder="City" value={address.city}
                    onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5">State *</label>
                  <input className={inputCls} placeholder="State" value={address.state}
                    onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} />
                </div>
              </div>
              <Button
                onClick={() => { if (isAddressValid) setStep("payment"); else toast.error("Please fill all required fields correctly"); }}
                size="lg" fullWidth className="mt-6 rounded-xl"
              >
                Continue to Payment <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === "payment" && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-6">
              <h2 className="font-display text-xl font-medium text-stone-900 mb-5 flex items-center gap-2">
                <Lock className="w-5 h-5 text-souk-700" /> Payment Method
              </h2>

              <div className="space-y-3 mb-6">
                {[
                  { value: "RAZORPAY", label: "Pay Online", desc: "Credit/Debit card, UPI, Net Banking, Wallets", icon: "💳" },
                  { value: "COD", label: "Cash on Delivery", desc: "Pay in cash when your order arrives", icon: "🏠" },
                ].map(({ value, label, desc, icon }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === value ? "border-souk-700 bg-souk-50" : "border-stone-200 hover:border-souk-300"
                    }`}
                  >
                    <input type="radio" name="payment" value={value} checked={paymentMethod === value as any}
                      onChange={() => setPaymentMethod(value as any)} className="sr-only" />
                    <span className="text-2xl">{icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-stone-900 text-sm font-sans">{label}</p>
                      <p className="text-xs text-stone-500 font-sans mt-0.5">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === value ? "border-souk-700 bg-souk-700" : "border-stone-300"
                    }`}>
                      {paymentMethod === value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                ))}
              </div>

              {/* Coupon code */}
              <div className="border-t border-stone-100 pt-5">
                <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5" /> Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    className={`${inputCls} flex-1`}
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!couponApplied}
                  />
                  {couponApplied ? (
                    <Button variant="outline" size="md" onClick={() => { setCouponApplied(null); setCouponCode(""); }} className="rounded-xl flex-shrink-0">
                      Remove
                    </Button>
                  ) : (
                    <Button variant="outline" size="md" onClick={handleApplyCoupon} className="rounded-xl flex-shrink-0">
                      Apply
                    </Button>
                  )}
                </div>
                {couponApplied && (
                  <p className="text-xs text-green-600 font-medium mt-1.5 font-sans">
                    ✓ {couponApplied.code} — {fmt(couponApplied.discount)} discount applied
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" size="md" onClick={() => setStep("address")} className="rounded-xl border border-stone-200">
                  Back
                </Button>
                <Button size="lg" onClick={handlePlaceOrder} loading={loading} fullWidth className="rounded-xl">
                  {paymentMethod === "RAZORPAY" ? `Pay ${fmt(finalTotal)}` : `Place COD Order — ${fmt(finalTotal)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Order summary sidebar ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5 sticky top-24">
            <h2 className="font-display text-lg font-medium text-stone-900 mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 mb-4">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-3 items-center">
                  <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 truncate font-sans">{item.name}</p>
                    <p className="text-xs text-stone-400 font-sans">{item.size} × {item.qty}</p>
                  </div>
                  <span className="text-xs font-semibold text-stone-900 font-sans flex-shrink-0">
                    {fmt(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-100 pt-4 space-y-2 text-sm font-sans">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span><span>{fmt(cartTotal)}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({couponApplied.code})</span>
                  <span>−{fmt(couponApplied.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span><span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-semibold text-stone-900 text-base pt-1 border-t border-stone-100">
                <span>Total</span>
                <span className="text-souk-700 font-display">{fmt(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
