// ─────────────────────────────────────────────────────────────────────────────
// app/admin/page.tsx — Admin Dashboard
// Replaces: pages/admin.html + admin.js
// Server component — fetches analytics directly from Prisma
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/utils/format";
import { AdminRevenueChart } from "@/components/admin/AdminRevenueChart";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import {
  TrendingUp, ShoppingBag, CreditCard, Package, Users, Tag
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

async function getAnalytics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalOrders, paidOrders, codOrders, revenueResult, totalUsers, recentOrders, topProducts] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: "PAID" } }),
      prisma.order.count({ where: { paymentMethod: "COD" } }),
      prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          items: { select: { name: true, qty: true }, take: 2 },
          user: { select: { name: true } },
        },
      }),
      prisma.orderItem.groupBy({
        by: ["productId", "name", "image"],
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5,
      }),
    ]);

  return {
    totalRevenue: revenueResult._sum.total ?? 0,
    totalOrders, paidOrders, codOrders, totalUsers,
    recentOrders, topProducts,
  };
}

export default async function AdminDashboard() {
  const data = await getAnalytics();

  const stats = [
    { label: "Total Revenue", value: fmt(data.totalRevenue), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: data.totalOrders.toString(), icon: ShoppingBag, color: "text-souk-700", bg: "bg-souk-50" },
    { label: "Paid Orders", value: data.paidOrders.toString(), icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "COD Orders", value: data.codOrders.toString(), icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Customers", value: data.totalUsers.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Pending", value: (data.totalOrders - data.paidOrders).toString(), icon: Tag, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="font-display text-3xl font-medium text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500 font-sans mt-1">Souk Fashion House — Admin Panel</p>
      </div>

      {/* ── Stats grid — replaces card-grid from admin.js ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className={`font-display text-2xl font-semibold ${color}`}>{value}</p>
            <p className="text-xs text-stone-500 font-sans mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue chart (client component) ── */}
      <AdminRevenueChart />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-souk-sm">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-display text-lg font-medium text-stone-900">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs font-medium text-souk-700 hover:text-souk-800 font-sans">
              View all →
            </a>
          </div>
          <div className="divide-y divide-stone-50">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-4 hover:bg-stone-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-souk-50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-souk-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 font-mono">{order.orderId}</p>
                  <p className="text-xs text-stone-500 font-sans truncate">
                    {order.user?.name ?? order.guestName ?? "Guest"} · {order.items.map((i) => i.name).join(", ")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-stone-900 font-sans">{fmt(order.total)}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full font-sans ${
                    order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                    order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                    order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm">
          <div className="p-5 border-b border-stone-100">
            <h2 className="font-display text-lg font-medium text-stone-900">Top Products</h2>
          </div>
          <div className="divide-y divide-stone-50">
            {data.topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3 p-4">
                <span className="text-xs font-bold text-stone-300 w-4 font-sans">{i + 1}</span>
                <img src={p.image} alt={p.name} className="w-10 h-12 rounded-lg object-cover bg-cream-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate font-sans">{p.name}</p>
                  <p className="text-xs text-stone-400 font-sans">{p._sum.qty ?? 0} units sold</p>
                </div>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <p className="p-4 text-sm text-stone-400 text-center font-sans">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Orders management table ── */}
      <AdminOrdersTable />
    </div>
  );
}
