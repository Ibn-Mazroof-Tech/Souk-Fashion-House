// ─────────────────────────────────────────────────────────────────────────────
// app/admin/orders/page.tsx — Full Order Management Page
// ─────────────────────────────────────────────────────────────────────────────

import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders — Admin" };

export default function AdminOrdersPage() {
  return (
    <div className="p-6 page-enter">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-medium text-stone-900">Orders</h1>
        <p className="text-sm text-stone-400 font-sans mt-1">
          Manage all customer orders — update status, search, filter
        </p>
      </div>
      <AdminOrdersTable />
    </div>
  );
}
