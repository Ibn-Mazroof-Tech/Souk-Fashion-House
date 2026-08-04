"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/admin/filters/page.tsx — Dynamic Filter Management
// Admin defines attributes (Fabric, Occasion, Color, ...) and their values;
// these become available both on the product form (to tag products) and on
// the storefront filter sidebar (to browse by them).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";

type FilterValue = { id: string; value: string; colorHex: string | null; _count: { products: number } };
type FilterAttribute = { id: string; name: string; slug: string; type: "text" | "color"; values: FilterValue[] };

const inputCls = "px-3 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 bg-white placeholder:text-stone-400";

export default function AdminFiltersPage() {
  const [attributes, setAttributes] = useState<FilterAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"text" | "color">("text");
  const [creating, setCreating] = useState(false);

  // Per-attribute "add value" inline inputs
  const [valueDraft, setValueDraft] = useState<Record<string, { value: string; colorHex: string }>>({});
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);

  const fetchAttributes = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/filters");
    const data = await res.json();
    if (data.success) setAttributes(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchAttributes(); }, []);

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error("Enter a filter name"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), type: newType }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Filter "${data.data.name}" created`);
        setNewName(""); setNewType("text"); setShowForm(false);
        fetchAttributes();
      } else {
        toast.error(data.error);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAttribute = async (attr: FilterAttribute) => {
    if (!confirm(`Delete the "${attr.name}" filter and all its values? Products tagged with it will lose that tag.`)) return;
    const res = await fetch(`/api/admin/filters/${attr.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      toast.success("Filter deleted");
      setAttributes((attrs) => attrs.filter((a) => a.id !== attr.id));
    } else {
      toast.error(data.error);
    }
  };

  const handleAddValue = async (attr: FilterAttribute) => {
    const draft = valueDraft[attr.id];
    if (!draft?.value?.trim()) { toast.error("Enter a value"); return; }
    setAddingValueFor(attr.id);
    try {
      const res = await fetch(`/api/admin/filters/${attr.id}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: draft.value.trim(),
          ...(attr.type === "color" && { colorHex: draft.colorHex || "#000000" }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAttributes((attrs) =>
          attrs.map((a) => (a.id === attr.id ? { ...a, values: [...a.values, data.data] } : a))
        );
        setValueDraft((d) => ({ ...d, [attr.id]: { value: "", colorHex: "#000000" } }));
      } else {
        toast.error(data.error);
      }
    } finally {
      setAddingValueFor(null);
    }
  };

  const handleDeleteValue = async (attr: FilterAttribute, val: FilterValue) => {
    if (val._count.products > 0 && !confirm(`"${val.value}" is used on ${val._count.products} product(s). Remove it anyway?`)) return;
    const res = await fetch(`/api/admin/filters/${attr.id}/values/${val.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setAttributes((attrs) =>
        attrs.map((a) => (a.id === attr.id ? { ...a, values: a.values.filter((v) => v.id !== val.id) } : a))
      );
    } else {
      toast.error(data.error);
    }
  };

  return (
    <div className="p-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-900">Filters</h1>
          <p className="text-sm text-stone-400 font-sans mt-1">
            Define product filters like Fabric, Occasion, or Color — they'll show up when adding a product and on the storefront filter sidebar
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="md" className="rounded-xl flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Filter
        </Button>
      </div>

      {/* Create attribute form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5 mb-6">
          <form onSubmit={handleCreateAttribute} className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="label-xs">Filter Name</label>
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Fabric, Occasion, Sleeve Length" className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="label-xs">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value as "text" | "color")} className={inputCls}>
                <option value="text">Text (chips)</option>
                <option value="color">Color (swatches)</option>
              </select>
            </div>
            <Button type="submit" disabled={creating} size="md" className="rounded-xl">
              {creating ? "Creating…" : "Create"}
            </Button>
            <button type="button" onClick={() => { setShowForm(false); setNewName(""); }}
              className="p-2.5 text-stone-400 hover:text-red-500" aria-label="Cancel">
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Attributes list */}
      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
        </div>
      ) : attributes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 py-16 flex flex-col items-center gap-3">
          <SlidersHorizontal className="w-8 h-8 text-stone-300" />
          <p className="text-sm text-stone-400 font-sans">No filters yet — add one to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attributes.map((attr) => (
            <div key={attr.id} className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display text-lg font-medium text-stone-900">{attr.name}</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                    {attr.type === "color" ? "Color swatches" : "Text chips"}
                  </span>
                </div>
                <button onClick={() => handleDeleteAttribute(attr)}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete filter">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {attr.values.length === 0 && (
                  <p className="text-xs text-stone-400 font-sans">No values yet — add one below</p>
                )}
                {attr.values.map((v) => (
                  <span key={v.id}
                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-stone-50 border border-stone-200 text-xs font-medium text-stone-700 font-sans">
                    {attr.type === "color" && (
                      <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: v.colorHex ?? "#d6d3d1" }} />
                    )}
                    {v.value}
                    {v._count.products > 0 && <span className="text-stone-400">({v._count.products})</span>}
                    <button onClick={() => handleDeleteValue(attr, v)} className="text-stone-400 hover:text-red-500 ml-0.5" aria-label={`Remove ${v.value}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={valueDraft[attr.id]?.value ?? ""}
                  onChange={(e) => setValueDraft((d) => ({ ...d, [attr.id]: { ...d[attr.id], value: e.target.value, colorHex: d[attr.id]?.colorHex ?? "#000000" } }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddValue(attr); } }}
                  placeholder={attr.type === "color" ? "e.g. Maroon" : "e.g. Cotton"}
                  className={`${inputCls} flex-1 max-w-xs py-2`}
                />
                {attr.type === "color" && (
                  <input
                    type="color"
                    value={valueDraft[attr.id]?.colorHex ?? "#000000"}
                    onChange={(e) => setValueDraft((d) => ({ ...d, [attr.id]: { value: d[attr.id]?.value ?? "", colorHex: e.target.value } }))}
                    className="w-9 h-9 rounded-lg border border-stone-200 cursor-pointer flex-shrink-0"
                  />
                )}
                <button
                  onClick={() => handleAddValue(attr)}
                  disabled={addingValueFor === attr.id}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-souk-700 hover:bg-souk-50 rounded-lg transition-colors font-sans"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
