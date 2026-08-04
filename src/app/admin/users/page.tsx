"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/admin/users/page.tsx — User Management
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Search, Users, Crown, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: { orders: number };
};

const EMPTY_FORM = { name: "", email: "", phone: "", role: "CUSTOMER", password: "" };
const inputCls = "w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 bg-white placeholder:text-stone-400";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User created");
        setShowForm(false);
        setForm({ ...EMPTY_FORM });
        fetchUsers();
      } else {
        toast.error(data.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    setSavingRoleId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Role updated");
        setUsers((us) => us.map((u) => (u.id === id ? { ...u, role } : u)));
      } else {
        toast.error(data.error);
      }
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete "${user.name ?? user.email}"? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      toast.success("User deleted");
      fetchUsers();
    } else {
      toast.error(data.error);
    }
  };

  return (
    <div className="p-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-900">Users</h1>
          <p className="text-sm text-stone-400 font-sans mt-1">{total} registered customers</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="md" className="rounded-xl">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-stone-900">New User</h2>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-xs">Name *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name" className={inputCls} />
            </div>
            <div>
              <label className="label-xs">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@email.com" className={inputCls} />
            </div>
            <div>
              <label className="label-xs">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210" className={inputCls} />
            </div>
            <div>
              <label className="label-xs">Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={inputCls}>
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Leave blank if they'll sign in with Google" className={inputCls} />
              <p className="text-[11px] text-stone-400 mt-1 font-sans">Min 8 characters, 1 uppercase, 1 number — optional</p>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-1">
              <Button type="submit" disabled={saving} size="md" className="rounded-xl">
                {saving ? "Creating…" : "Create User"}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => setShowForm(false)} className="rounded-xl border border-stone-200">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

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
                  {["User", "Email", "Phone", "Role", "Orders", "Joined", ""].map((h) => (
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
                      <select
                        value={user.role}
                        disabled={savingRoleId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full font-sans border-0 focus:outline-none focus:ring-2 focus:ring-souk-700 cursor-pointer disabled:opacity-50 ${
                          user.role === "ADMIN"
                            ? "bg-souk-100 text-souk-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
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
                    <td className="px-5 py-3.5">
                      {session?.user?.id !== user.id && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-400 font-sans">
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
