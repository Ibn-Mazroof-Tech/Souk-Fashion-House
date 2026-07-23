"use client";
// app/admin/coupons/page.tsx — Coupon Management

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fmt } from "@/lib/utils/format";

type Coupon = {
  id: string; code: string; type: string; value: number;
  minOrder: number; maxUses: number | null; usedCount: number;
  expiresAt: string | null; active: boolean; createdAt: string;
};

const EMPTY = {
  code: "", type: "percent", value: "", minOrder: "0",
  maxUses: "", expiresAt: "", active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const fetchCoupons = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    if (data.success) setCoupons(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          type: form.type,
          value: parseInt(form.value),
          minOrder: parseInt(form.minOrder) * 100, // convert ₹ to paise
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Coupon created!");
        setShowForm(false);
        setForm({ ...EMPTY });
        fetchCoupons();
      } else {
        toast.error(data.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Coupon deleted"); fetchCoupons(); }
    else toast.error("Delete failed");
  };

  const handleToggle = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(active ? "Coupon deactivated" : "Coupon activated");
      fetchCoupons();
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 bg-white placeholder:text-stone-400";

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-900">Coupons</h1>
          <p className="text-sm text-stone-400 font-sans mt-1">
            Discount codes for customers — percent or flat off
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} size="md" className="rounded-xl">
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-souk-100 shadow-souk-md p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-medium text-stone-900">New Coupon</h2>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5 font-sans">Code *</label>
              <input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="WELCOME10" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5 font-sans">Type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputCls}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5 font-sans">
                Value * ({form.type === "percent" ? "%" : "₹"})
              </label>
              <input required type="number" min="1" value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={form.type === "percent" ? "10" : "200"} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5 font-sans">Min Order (₹)</label>
              <input type="number" min="0" value={form.minOrder}
                onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                placeholder="500" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5 font-sans">Max Uses</label>
              <input type="number" min="1" value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide block mb-1.5 font-sans">Expires At</label>
              <input type="date" value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                min={new Date().toISOString().split("T")[0]} className={inputCls} />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <Button type="submit" loading={saving} className="rounded-xl">Create Coupon</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl border border-stone-200">Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Coupon list */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm overflow-hidden">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-2">
            <Tag className="w-8 h-8 text-stone-200" />
            <p className="text-sm text-stone-400 font-sans">No coupons yet — create your first one</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                {["Code", "Type", "Value", "Min Order", "Usage", "Expires", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-5 py-3 font-sans whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg text-sm">{c.code}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-stone-600 font-sans capitalize">{c.type}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-stone-900 font-sans">
                      {c.type === "percent" ? `${c.value}%` : fmt(c.value)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-stone-600 font-sans">{c.minOrder > 0 ? fmt(c.minOrder) : "None"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-sans text-stone-700">
                      {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-stone-400 font-sans">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Never"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleToggle(c.id, c.active)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full font-sans transition-colors ${
                        c.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}>
                      {c.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDelete(c.id, c.code)}
                      className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
