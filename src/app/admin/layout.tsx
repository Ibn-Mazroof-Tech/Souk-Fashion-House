// ─────────────────────────────────────────────────────────────────────────────
// app/admin/layout.tsx — Admin Layout
// Protected by middleware.ts (ADMIN role required)
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminSidebarClient } from "@/components/admin/AdminSidebarClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Double-check role server-side (middleware is the first line, this is the second)
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <AdminSidebarClient userName={session.user.name ?? "Admin"} userEmail={session.user.email ?? ""} />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
