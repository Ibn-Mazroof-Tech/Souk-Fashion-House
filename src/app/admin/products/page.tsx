"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/admin/products/page.tsx — Product Management
// Full CRUD: list, create, edit, delete + Cloudinary image upload
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, ImageIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fmt } from "@/lib/utils/format";

type ProductVariant = { size: string; color: string; colorHex: string; stock: number };
type ColorImageSet = { color: string; images: string[] };

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  stock: number;
  featured: boolean;
  active: boolean;
  images: string[];
  sizes: string[];
  categoryId: string;
  category: { name: string; id: string };
  variants?: { size: string; color: string; colorHex: string | null; stock: number }[];
  colorImages?: { color: string; images: string[] }[];
};

type Category = { id: string; name: string; slug: string; _count?: { products: number } };

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Free"];
const EMPTY_FORM = {
  name: "", description: "", price: "", mrp: "", stock: "0",
  featured: false, active: true, images: [] as string[],
  sizes: [] as string[], categoryId: "",
  useVariants: false, variants: [] as ProductVariant[],
  colorImages: [] as ColorImageSet[],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [uploading, setUploading] = useState(false);
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const colorFileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    const [prodRes, catRes] = await Promise.all([
      fetch(`/api/admin/products?${params}`).then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()).catch(() => ({ success: false })),
    ]);
    if (prodRes.success) {
      setProducts(prodRes.data.products);
      setTotal(prodRes.data.pagination.total);
      setPages(prodRes.data.pagination.pages);
    }
    if (catRes.success) setCategories(catRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  // ── Image upload to Cloudinary ──────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({ ...f, images: [...f.images, data.data.url] }));
        toast.success("Image uploaded");
      } else {
        toast.error(data.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── Per-color image upload — used when "Size + Color variants" is on, so
  //     each color can show its own photos on the product page ──────────────
  const [activeUploadColor, setActiveUploadColor] = useState<string | null>(null);

  const startColorUpload = (color: string) => {
    setActiveUploadColor(color);
    colorFileRef.current?.click();
  };

  const handleColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const color = activeUploadColor;
    if (!file || !color) return;
    setUploadingColor(color);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((f) => {
          const existing = f.colorImages.find((ci) => ci.color === color);
          const colorImages = existing
            ? f.colorImages.map((ci) => (ci.color === color ? { ...ci, images: [...ci.images, data.data.url] } : ci))
            : [...f.colorImages, { color, images: [data.data.url] }];
          return { ...f, colorImages };
        });
        toast.success(`Image added for ${color}`);
      } else {
        toast.error(data.error ?? "Upload failed");
      }
    } finally {
      setUploadingColor(null);
      setActiveUploadColor(null);
      if (colorFileRef.current) colorFileRef.current.value = "";
    }
  };

  const removeColorImage = (color: string, index: number) =>
    setForm((f) => ({
      ...f,
      colorImages: f.colorImages.map((ci) =>
        ci.color === color ? { ...ci, images: ci.images.filter((_, i) => i !== index) } : ci
      ),
    }));

  // ── Inline "+ Add New Category" ──────────────────────────────────────────
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) { toast.error("Enter a category name"); return; }
    setCreatingCategory(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((cats) => [...cats, { ...data.data, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
        setForm((f) => ({ ...f, categoryId: data.data.id }));
        toast.success(`Category "${data.data.name}" created`);
        setNewCategoryName("");
        setShowNewCategory(false);
      } else {
        toast.error(data.error ?? "Could not create category");
      }
    } finally {
      setCreatingCategory(false);
    }
  };

  // ── Submit create/edit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Select a category"); return; }
    if (form.images.length === 0) { toast.error("Upload at least one image"); return; }

    if (form.useVariants) {
      if (form.variants.length === 0) { toast.error("Add at least one size/color variant"); return; }
      if (form.variants.some((v) => !v.size || !v.color)) {
        toast.error("Every variant needs a size and a color");
        return;
      }
    } else if (form.sizes.length === 0) {
      toast.error("Select at least one size");
      return;
    }

    setSaving(true);
    try {
      // Derive sizes/stock from variants when in variant mode, so legacy
      // fields (used elsewhere for display/fallback) stay consistent.
      const derivedSizes = form.useVariants
        ? Array.from(new Set(form.variants.map((v) => v.size)))
        : form.sizes;
      const derivedStock = form.useVariants
        ? form.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : parseInt(form.stock) || 0;

      const payload = {
        name: form.name,
        description: form.description,
        price: parseInt(form.price),      // admin inputs in ₹, API converts to paise
        mrp: parseInt(form.mrp),
        stock: derivedStock,
        featured: form.featured,
        active: form.active,
        images: form.images,
        sizes: derivedSizes,
        categoryId: form.categoryId,
        variants: form.useVariants ? form.variants : [],
        colorImages: form.useVariants
          ? form.colorImages.filter((ci) => ci.images.length > 0)
          : [],
      };

      const url = editId ? `/api/admin/products/${editId}` : "/api/admin/products";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editId ? "Product updated!" : "Product created!");
        resetForm();
        fetchProducts();
      } else {
        toast.error(data.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditId(p.id);
    const hasVariants = (p.variants?.length ?? 0) > 0;
    setForm({
      name: p.name, description: "", price: String(p.price / 100),
      mrp: String(p.mrp / 100), stock: String(p.stock),
      featured: p.featured, active: p.active,
      images: p.images, sizes: p.sizes, categoryId: p.categoryId,
      useVariants: hasVariants,
      variants: hasVariants
        ? p.variants!.map((v) => ({ size: v.size, color: v.color, colorHex: v.colorHex ?? "#000000", stock: v.stock }))
        : [],
      colorImages: p.colorImages ?? [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"? It will be hidden from the store but order history is preserved.`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Product deactivated"); fetchProducts(); }
    else toast.error("Delete failed");
  };

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setForm({ ...EMPTY_FORM, sizes: [], images: [], variants: [], colorImages: [] });
    setShowNewCategory(false); setNewCategoryName("");
  };

  const toggleSize = (size: string) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }));

  // ── Variant row helpers ──────────────────────────────────────────────────
  const addVariantRow = () =>
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { size: SIZE_OPTIONS[0], color: "", colorHex: "#000000", stock: 0 }],
    }));

  const updateVariantRow = (index: number, patch: Partial<ProductVariant>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));

  const removeVariantRow = (index: number) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));

  const inputCls = "w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 bg-white placeholder:text-stone-400";

  return (
    <div className="p-6 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-900">Products</h1>
          <p className="text-sm text-stone-400 font-sans mt-0.5">{total} products</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="md" className="rounded-xl">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* ── CREATE / EDIT FORM ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-souk-100 shadow-souk-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-medium text-stone-900">
              {editId ? "Edit Product" : "New Product"}
            </h2>
            <button onClick={resetForm} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="label-xs">Product Name *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Classic Kashmiri Pheran" className={inputCls} />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="label-xs">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Product description…" className={`${inputCls} resize-none`} />
            </div>

            {/* Price + MRP */}
            <div>
              <label className="label-xs">Selling Price (₹) *</label>
              <input required type="number" min="1" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="2999" className={inputCls} />
            </div>
            <div>
              <label className="label-xs">MRP / Original Price (₹) *</label>
              <input required type="number" min="1" value={form.mrp}
                onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
                placeholder="3999" className={inputCls} />
            </div>

            {/* Stock (simple mode only) + Category */}
            <div>
              <label className="label-xs">Stock Quantity *</label>
              <input required={!form.useVariants} disabled={form.useVariants} type="number" min="0" value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className={`${inputCls} ${form.useVariants ? "opacity-50 cursor-not-allowed" : ""}`} />
              {form.useVariants && (
                <p className="text-[11px] text-stone-400 mt-1 font-sans">Auto-calculated from variants below</p>
              )}
            </div>
            <div>
              <label className="label-xs">Category *</label>
              {!showNewCategory ? (
                <select required value={form.categoryId}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setShowNewCategory(true);
                    } else {
                      setForm((f) => ({ ...f, categoryId: e.target.value }));
                    }
                  }}
                  className={inputCls}>
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="__new__">+ Add New Category</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus type="text" placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
                    className={inputCls}
                  />
                  <Button type="button" onClick={handleCreateCategory} disabled={creatingCategory} size="md" className="rounded-xl flex-shrink-0">
                    {creatingCategory ? "…" : "Add"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}
                    className="p-2.5 text-stone-400 hover:text-red-500 flex-shrink-0"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Variant mode toggle */}
            <div className="md:col-span-2 flex items-center gap-2.5 py-1">
              <div
                onClick={() => setForm((f) => ({ ...f, useVariants: !f.useVariants }))}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                  form.useVariants ? "bg-souk-700" : "bg-stone-200"
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  form.useVariants ? "left-5" : "left-0.5"
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800 font-sans">Size + Color variants</p>
                <p className="text-[11px] text-stone-400 font-sans">Track stock separately for each size/color combination</p>
              </div>
            </div>

            {/* Sizes — simple mode only */}
            {!form.useVariants && (
              <div className="md:col-span-2">
                <label className="label-xs">Available Sizes *</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {SIZE_OPTIONS.map((size) => (
                    <button
                      key={size} type="button" onClick={() => toggleSize(size)}
                      className={`px-4 py-1.5 rounded-xl border text-sm font-medium font-sans transition-all ${
                        form.sizes.includes(size)
                          ? "bg-souk-700 text-white border-souk-700"
                          : "bg-white text-stone-600 border-stone-200 hover:border-souk-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variant builder — variant mode only */}
            {form.useVariants && (
              <div className="md:col-span-2">
                <label className="label-xs">Size / Color Variants *</label>
                <div className="space-y-2 mt-1.5">
                  {form.variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl p-2.5">
                      <select
                        value={v.size}
                        onChange={(e) => updateVariantRow(i, { size: e.target.value })}
                        className="px-2.5 py-2 border border-stone-200 rounded-lg text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-souk-700"
                      >
                        {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        type="text" placeholder="Color name (e.g. Black)"
                        value={v.color}
                        onChange={(e) => updateVariantRow(i, { color: e.target.value })}
                        className="flex-1 min-w-0 px-2.5 py-2 border border-stone-200 rounded-lg text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-souk-700"
                      />
                      <input
                        type="color" value={v.colorHex}
                        onChange={(e) => updateVariantRow(i, { colorHex: e.target.value })}
                        className="w-9 h-9 rounded-lg border border-stone-200 cursor-pointer flex-shrink-0"
                        aria-label="Swatch color"
                      />
                      <input
                        type="number" min="0" placeholder="Stock"
                        value={v.stock}
                        onChange={(e) => updateVariantRow(i, { stock: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2.5 py-2 border border-stone-200 rounded-lg text-xs font-sans bg-white focus:outline-none focus:ring-2 focus:ring-souk-700 flex-shrink-0"
                      />
                      <button
                        type="button" onClick={() => removeVariantRow(i)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Remove variant"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button" onClick={addVariantRow}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-souk-700 hover:bg-souk-50 rounded-lg transition-colors font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </button>
                  {form.variants.length > 0 && (
                    <p className="text-[11px] text-stone-400 font-sans pt-1">
                      Total stock: {form.variants.reduce((s, v) => s + (v.stock || 0), 0)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Per-color images — variant mode only, one uploader per distinct color */}
            {form.useVariants && (() => {
              const distinctColors = Array.from(
                new Map(form.variants.filter((v) => v.color).map((v) => [v.color, v.colorHex])).entries()
              );
              if (distinctColors.length === 0) return null;
              return (
                <div className="md:col-span-2">
                  <label className="label-xs">Photos per Color</label>
                  <p className="text-[11px] text-stone-400 font-sans mb-2">
                    Optional — if a color has no photos, the general Product Images below are shown instead
                  </p>
                  <div className="space-y-3">
                    {distinctColors.map(([color, colorHex]) => {
                      const imgs = form.colorImages.find((ci) => ci.color === color)?.images ?? [];
                      return (
                        <div key={color} className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                              style={{ backgroundColor: colorHex || "#d6d3d1" }}
                            />
                            <span className="text-xs font-semibold text-stone-700 font-sans">{color}</span>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {imgs.map((url, i) => (
                              <div key={i} className="relative w-16 h-20 rounded-lg overflow-hidden border border-stone-200 group">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeColorImage(color, i)}
                                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-2 h-2" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => startColorUpload(color)}
                              disabled={uploadingColor === color}
                              className="w-16 h-20 rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1 text-stone-400 hover:border-souk-400 hover:text-souk-700 transition-colors"
                            >
                              {uploadingColor === color ? (
                                <div className="w-4 h-4 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-sans font-medium">Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <input ref={colorFileRef} type="file" accept="image/*" className="hidden" onChange={handleColorImageUpload} />
                </div>
              );
            })()}

            {/* Images */}
            <div className="md:col-span-2">
              <label className="label-xs">Product Images *</label>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {form.images.map((url, i) => (
                  <div key={i} className="relative w-20 h-24 rounded-xl overflow-hidden border border-stone-200 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button" onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-24 rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1.5 text-stone-400 hover:border-souk-400 hover:text-souk-700 transition-colors"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] font-sans font-medium">Upload</span>
                    </>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              {[
                { key: "featured", label: "Featured on homepage" },
                { key: "active", label: "Active (visible in store)" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      form[key as keyof typeof form] ? "bg-souk-700" : "bg-stone-200"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      form[key as keyof typeof form] ? "left-5" : "left-0.5"
                    }`} />
                  </div>
                  <span className="text-xs text-stone-600 font-sans">{label}</span>
                </label>
              ))}
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button type="submit" loading={saving} size="lg" className="rounded-xl">
                {editId ? "Update Product" : "Create Product"}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={resetForm} className="rounded-xl border border-stone-200">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── PRODUCT LIST ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm">
        <div className="p-5 border-b border-stone-100 flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products…" className="pl-8 pr-4 py-2 border border-stone-200 rounded-xl text-xs font-sans bg-stone-50 focus:outline-none focus:ring-2 focus:ring-souk-700 w-full" />
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
                  {["Product", "Category", "Price", "MRP", "Stock", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-5 py-3 font-sans whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0">
                          {p.images[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-stone-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900 font-sans">{p.name}</p>
                          <p className="text-xs text-stone-400 font-mono">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-souk-50 text-souk-700 px-2 py-1 rounded-full font-medium font-sans">
                        {p.category.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-stone-900 font-sans">{fmt(p.price)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-stone-400 line-through font-sans">{fmt(p.mrp)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-semibold font-sans ${p.stock <= 5 ? "text-red-500" : "text-stone-700"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full font-sans w-fit ${
                          p.active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                        }`}>
                          {p.active ? "Active" : "Hidden"}
                        </span>
                        {p.featured && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-sans w-fit">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(p)}
                          className="p-1.5 text-stone-400 hover:text-souk-700 hover:bg-souk-50 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
