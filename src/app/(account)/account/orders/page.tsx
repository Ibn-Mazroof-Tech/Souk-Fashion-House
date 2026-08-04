// ─────────────────────────────────────────────────────────────────────────────
// app/(account)/account/orders/page.tsx — User Order History
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/utils/format";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders" };
export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  ORDERED:   "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED:   "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { name: true, image: true, size: true, color: true, qty: true, price: true } },
    },
  });

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-souk-50 flex items-center justify-center mx-auto mb-5">
          <Package className="w-7 h-7 text-souk-700" />
        </div>
        <h1 className="font-display text-2xl font-medium text-stone-900 mb-2">No orders yet</h1>
        <p className="text-stone-500 text-sm font-sans mb-6">Your order history will appear here.</p>
        <Link href="/products" className="btn-souk inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-medium text-stone-900 mb-8">
        My Orders
        <span className="ml-3 font-sans text-base font-normal text-stone-400">({orders.length})</span>
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm overflow-hidden">
            {/* Order header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50 bg-stone-50/40">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-stone-400 font-sans">Order ID</p>
                  <p className="font-mono font-bold text-stone-900 text-sm">{order.orderId}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-sans">Date</p>
                  <p className="text-sm text-stone-700 font-sans">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-sans">Total</p>
                  <p className="font-display text-base font-semibold text-souk-700">{fmt(order.total)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full font-sans ${statusColors[order.status] ?? "bg-stone-100 text-stone-600"}`}>
                  {order.status}
                </span>
                <Link
                  href={`/orders/track?orderId=${order.orderId}`}
                  className="text-xs font-medium text-souk-700 hover:text-souk-800 font-sans flex items-center gap-1"
                >
                  Track <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Order items */}
            <div className="px-5 py-4 space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1445205170230-053b83016050?w=100"}
                    alt={item.name}
                    className="w-12 h-14 rounded-lg object-cover bg-cream-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate font-sans">{item.name}</p>
                    <p className="text-xs text-stone-400 font-sans">{item.size}{item.color ? ` / ${item.color}` : ""} × {item.qty}</p>
                  </div>
                  <span className="text-sm font-semibold text-stone-700 font-sans flex-shrink-0">
                    {fmt(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
