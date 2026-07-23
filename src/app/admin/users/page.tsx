"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/admin/users/page.tsx — User Management
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Search, Users, Crown } from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: { orders: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (data.success) {
      setUsers(data.data.users);
      setTotal(data.data.pagination.total);
      setPages(data.data.pagination.pages);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page]);
  useEffect(() => {
    const t = setTimeout(fetchUsers, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="p-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-900">Users</h1>
          <p className="text-sm text-stone-400 font-sans mt-1">{total} registered customers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Admins", value: users.filter((u) => u.role === "ADMIN").length, icon: Crown, color: "text-souk-700", bg: "bg-souk-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`font-display text-2xl font-semibold ${color}`}>{value}</p>
            <p className="text-xs text-stone-500 font-sans mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm">
        <div className="p-5 border-b border-stone-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email…"
              className="pl-8 pr-4 py-2 border border-stone-200 rounded-xl text-xs font-sans bg-stone-50 focus:outline-none focus:ring-2 focus:ring-souk-700 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  {["User", "Email", "Phone", "Role", "Orders", "Joined"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-5 py-3 font-sans whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-souk-100 flex items-center justify-center text-souk-700 text-xs font-bold font-sans flex-shrink-0">
                          {user.name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-stone-900 font-sans">
                          {user.name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-stone-600 font-sans">{user.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-stone-500 font-sans">{user.phone ?? "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full font-sans ${
                        user.role === "ADMIN"
                          ? "bg-souk-100 text-souk-700"
                          : "bg-stone-100 text-stone-600"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-stone-700 font-sans">
                        {user._count.orders}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-stone-400 font-sans whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-stone-400 font-sans">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {pages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between">
            <p className="text-xs text-stone-400 font-sans">Page {page} of {pages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 font-sans">Prev</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 font-sans">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
