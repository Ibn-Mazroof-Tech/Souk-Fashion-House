"use client";
// ─────────────────────────────────────────────────────────────────────────────
// components/admin/AdminOrdersTable.tsx
// Full order management: search, filter by status, live status updates
// Replaces: ord-search + statusSel from admin.js (but now with real API calls)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useTransition, useCallback } from "react";
import { Search, RefreshCw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { fmt } from "@/lib/utils/format";

type OrderSummary = {
  id: string;
  orderId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  guestName: string | null;
  guestPhone: string | null;
  user: { name: string; email: string } | null;
  items: { name: string; qty: number; size: string; color?: string | null }[];
};

const ORDER_STATUSES = ["ORDERED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const statusColors: Record<string, string> = {
  ORDERED:   "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED:   "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const paymentColors: Record<string, string> = {
  PAID:    "text-green-600",
  PENDING: "text-amber-600",
  FAILED:  "text-red-600",
};

export function AdminOrdersTable() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
        setTotal(data.data.pagination.total);
        setPages(data.data.pagination.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounced search — replaces ord-search oninput from admin.js
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchOrders(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Update order status — replaces .statusSel change from admin.js
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        toast.success(`Order status → ${newStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm">
      {/* Header */}
      <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-medium text-stone-900">Order Management</h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">{total} total orders</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Search — replaces #ord-search from admin.js */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, phone, name…"
              className="pl-8 pr-4 py-2 border border-stone-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 bg-stone-50 w-52"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-stone-200 rounded-xl text-xs font-sans bg-stone-50 focus:outline-none focus:ring-2 focus:ring-souk-700 cursor-pointer"
          >
            <option value="all">All Status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => fetchOrders()}
            className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-stone-400 font-sans">
            No orders found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                {["Order ID", "Customer", "Items", "Total", "Payment", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-5 py-3 font-sans whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                  {/* Order ID */}
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-sm font-bold text-stone-900">{order.orderId}</span>
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-stone-800 font-sans whitespace-nowrap">
                      {order.user?.name ?? order.guestName ?? "Guest"}
                    </p>
                    <p className="text-xs text-stone-400 font-sans">
                      {order.user?.email ?? order.guestPhone ?? "—"}
                    </p>
                  </td>

                  {/* Items summary */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-stone-600 font-sans max-w-[160px] truncate">
                      {order.items.map((i) => `${i.name} (${i.size}${i.color ? `/${i.color}` : ""}×${i.qty})`).join(", ")}
                    </p>
                  </td>

                  {/* Total */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-stone-900 font-sans whitespace-nowrap">
                      {fmt(order.total)}
                    </span>
                  </td>

                  {/* Payment status */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs font-semibold font-sans ${paymentColors[order.paymentStatus] ?? "text-stone-500"}`}>
                        {order.paymentStatus}
                      </span>
                      <span className="text-xs text-stone-400 font-sans">{order.paymentMethod}</span>
                    </div>
                  </td>

                  {/* Order status badge */}
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full font-sans whitespace-nowrap ${statusColors[order.status] ?? "bg-stone-100 text-stone-600"}`}>
                      {order.status}
                    </span>
                  </td>

                  {/* Created date */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-stone-400 font-sans whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                  </td>

                  {/* Status update — replaces .statusSel from admin.js */}
                  <td className="px-5 py-3.5">
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="appearance-none pl-2.5 pr-7 py-1.5 border border-stone-200 rounded-lg text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-souk-700 cursor-pointer"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="p-4 border-t border-stone-100 flex items-center justify-between">
          <p className="text-xs text-stone-400 font-sans">Page {page} of {pages}</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 font-sans"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 font-sans"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
