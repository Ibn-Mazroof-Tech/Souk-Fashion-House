// app/(account)/account/page.tsx — User Profile Page

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Heart, User, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/account");

  const [orderCount, wishlistCount] = await Promise.all([
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.wishlist.count({ where: { userId: session.user.id } }),
  ]);

  const stats = [
    { label: "Total Orders", value: orderCount, icon: Package, href: "/account/orders" },
    { label: "Wishlist Items", value: wishlistCount, icon: Heart, href: "/wishlist" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 page-enter">
      <h1 className="font-display text-3xl font-medium text-stone-900 mb-8">My Account</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-souk-100 flex items-center justify-center flex-shrink-0">
          {session.user.image ? (
            <img src={session.user.image} alt={session.user.name ?? ""} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-souk-700" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-medium text-stone-900">{session.user.name ?? "Customer"}</h2>
          <p className="text-sm text-stone-500 font-sans">{session.user.email}</p>
          {session.user.role === "ADMIN" && (
            <span className="inline-block mt-1 text-xs font-semibold bg-souk-50 text-souk-700 px-2.5 py-1 rounded-full">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5 hover:border-souk-200 hover:shadow-souk-md transition-all group">
            <div className="w-9 h-9 rounded-xl bg-souk-50 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-souk-700" />
            </div>
            <p className="font-display text-3xl font-semibold text-souk-700">{value}</p>
            <p className="text-xs text-stone-500 font-sans mt-0.5 group-hover:text-souk-700 transition-colors">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm divide-y divide-stone-50">
        {[
          { href: "/account/orders", icon: Package, label: "My Orders", desc: "View your order history and track deliveries" },
          { href: "/wishlist", icon: Heart, label: "Wishlist", desc: "Products you've saved for later" },
          { href: "/orders/track", icon: MapPin, label: "Track an Order", desc: "Track any order with Order ID and phone" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50/50 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-souk-50 flex items-center justify-center flex-shrink-0 group-hover:bg-souk-100 transition-colors">
              <Icon className="w-4 h-4 text-souk-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-900 font-sans">{label}</p>
              <p className="text-xs text-stone-400 font-sans">{desc}</p>
            </div>
            <span className="text-stone-300 group-hover:text-souk-700 transition-colors">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
