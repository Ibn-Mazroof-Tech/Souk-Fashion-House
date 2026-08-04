"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/admin/categories/page.tsx — Category Management (2-level hierarchy)
// Top-level categories (Kurtis, Shawls, Suits, Collections) power the navbar
// mega-menu; each can have sub-categories (Lucknowi, Kashmiri, Stiched, ...).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, FolderTree, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

type SubCategory = { id: string; name: string; slug: string; _count: { products: number } };
type Category = SubCategory & { children: SubCategory[] };

const inputCls = "px-3 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 bg-white placeholder:text-stone-400";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState(""); // "" = top-level
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error("Enter a category name"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), parentId: newParentId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${data.data.name}" created`);
        setNewName(""); setNewParentId(""); setShowForm(false);
        fetchCategories();
      } else {
        toast.error(data.error);
      }
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (c: SubCategory) => { setEditingId(c.id); setEditName(c.name); };
  const cancelEdit = () => { setEditingId(null); setEditName(""); };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) { toast.error("Name can't be empty"); return; }
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Renamed");
        fetchCategories();
        cancelEdit();
      } else {
        toast.error(data.error);
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (c: SubCategory, isParent: boolean) => {
    if (isParent && categories.find((p) => p.id === c.id)?.children.length) {
      toast.error(`Delete the sub-categories under "${c.name}" first`);
      return;
    }
    const productNote = c._count.products > 0
      ? ` ${c._count.products} product(s) tagged with it will keep everything else — they'll just lose this category tag.`
      : "";
    if (!confirm(`Delete "${c.name}"?${productNote} This can't be undone.`)) return;
    const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Deleted"); fetchCategories(); }
    else toast.error(data.error);
  };

  return (
    <div className="p-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-900">Categories</h1>
          <p className="text-sm text-stone-400 font-sans mt-1">
            Top-level categories power the navbar menu; sub-categories show as a dropdown under each
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="md" className="rounded-xl">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5 mb-6">
          <form onSubmit={handleCreate} className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="label-xs">Name</label>
              <input
                autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Kurtis, or Lucknowi"
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="label-xs">Parent (optional)</label>
              <select value={newParentId} onChange={(e) => setNewParentId(e.target.value)} className={inputCls}>
                <option value="">— Top-level category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={creating} size="md" className="rounded-xl">
              {creating ? "Creating…" : "Create"}
            </Button>
            <button type="button" onClick={() => { setShowForm(false); setNewName(""); setNewParentId(""); }}
              className="p-2.5 text-stone-400 hover:text-red-500 flex-shrink-0" aria-label="Cancel">
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <FolderTree className="w-8 h-8 text-stone-300" />
            <p className="text-sm text-stone-400 font-sans">No categories yet</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {categories.map((c) => (
              <div key={c.id}>
                {/* Parent row */}
                <div className="flex items-center justify-between px-5 py-4 hover:bg-stone-50/50 transition-colors">
                  {editingId === c.id ? (
                    <EditRow
                      value={editName} onChange={setEditName}
                      onSave={() => saveEdit(c.id)} onCancel={cancelEdit}
                      saving={savingId === c.id}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-souk-50 flex items-center justify-center text-souk-700 flex-shrink-0">
                          <FolderTree className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900 font-sans">{c.name}</p>
                          <p className="text-xs text-stone-400 font-sans">
                            /{c.slug} · {c._count.products} product{c._count.products !== 1 ? "s" : ""}
                            {c.children.length > 0 && ` · ${c.children.length} sub-categor${c.children.length !== 1 ? "ies" : "y"}`}
                          </p>
                        </div>
                      </div>
                      <RowActions onEdit={() => startEdit(c)} onDelete={() => handleDelete(c, true)} />
                    </>
                  )}
                </div>

                {/* Children rows — indented */}
                {c.children.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between pl-14 pr-5 py-3 bg-stone-50/40 hover:bg-stone-50 transition-colors">
                    {editingId === sub.id ? (
                      <EditRow
                        value={editName} onChange={setEditName}
                        onSave={() => saveEdit(sub.id)} onCancel={cancelEdit}
                        saving={savingId === sub.id}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-stone-700 font-sans">{sub.name}</p>
                            <p className="text-xs text-stone-400 font-sans">
                              /{sub.slug} · {sub._count.products} product{sub._count.products !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <RowActions onEdit={() => startEdit(sub)} onDelete={() => handleDelete(sub, false)} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="p-2 text-stone-400 hover:text-souk-700 hover:bg-souk-50 rounded-lg transition-colors" aria-label="Rename">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDelete} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="Delete">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function EditRow({
  value, onChange, onSave, onCancel, saving,
}: { value: string; onChange: (v: string) => void; onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <input
        autoFocus value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
        className="flex-1 max-w-xs px-3 py-2 border border-stone-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700"
      />
      <button onClick={onSave} disabled={saving} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" aria-label="Save">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={onCancel} className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors" aria-label="Cancel">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
