"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/admin/homepage/page.tsx — Hero Carousel + Testimonials management
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X, Image as ImageIcon, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

type HeroSlide = {
  id: string; image: string; title: string | null; subtitle: string | null;
  linkUrl: string | null; active: boolean; sortOrder: number;
};
type Testimonial = {
  id: string; name: string; location: string | null; rating: number;
  text: string; active: boolean; sortOrder: number;
};

const inputCls = "w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 bg-white placeholder:text-stone-400";

export default function AdminHomepagePage() {
  return (
    <div className="p-6 page-enter space-y-10">
      <div>
        <h1 className="font-display text-3xl font-medium text-stone-900">Homepage</h1>
        <p className="text-sm text-stone-400 font-sans mt-1">Manage the hero carousel and customer testimonials</p>
      </div>
      <HeroSlidesSection />
      <TestimonialsSection />
    </div>
  );
}

// ── Hero Slides ──────────────────────────────────────────────────────────────

function HeroSlidesSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ image: "", title: "", subtitle: "", linkUrl: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchSlides = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/hero-slides");
    const data = await res.json();
    if (data.success) setSlides(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({ ...f, image: data.data.url }));
        toast.success("Image uploaded");
      } else {
        toast.error(data.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) { toast.error("Upload an image first"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/hero-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Slide added");
        setForm({ image: "", title: "", subtitle: "", linkUrl: "" });
        setShowForm(false);
        fetchSlides();
      } else {
        toast.error(data.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !slide.active }),
    });
    const data = await res.json();
    if (data.success) setSlides((s) => s.map((x) => (x.id === slide.id ? data.data : x)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hero slide?")) return;
    const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Deleted"); setSlides((s) => s.filter((x) => x.id !== id)); }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-medium text-stone-900">Hero Carousel</h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">Recommended: 3 images, wide/landscape, under 1MB each · max 5</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="md" className="rounded-xl" disabled={slides.length >= 5}>
          <Plus className="w-4 h-4" /> Add Slide
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5 mb-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-xs">Image *</label>
              {form.image ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-stone-200 mt-1.5">
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, image: "" }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="mt-1.5 w-full h-32 rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1.5 text-stone-400 hover:border-souk-400 hover:text-souk-700 transition-colors">
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-xs font-sans font-medium">Upload image</span>
                    </>
                  )}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
            <div>
              <label className="label-xs">Title (optional)</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Winter Collection" className={inputCls} />
            </div>
            <div>
              <label className="label-xs">Subtitle (optional)</label>
              <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="e.g. Up to 30% off Kashmiri pherans" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Link (optional)</label>
              <input value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="/products?category=kurtis" className={inputCls} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={saving} size="md" className="rounded-xl">
                {saving ? "Saving…" : "Add Slide"}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => setShowForm(false)} className="rounded-xl border border-stone-200">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="h-24 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 py-10 flex flex-col items-center gap-2">
          <ImageIcon className="w-7 h-7 text-stone-300" />
          <p className="text-sm text-stone-400 font-sans">No hero slides yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide) => (
            <div key={slide.id} className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm overflow-hidden">
              <div className="relative h-32">
                <img src={slide.image} alt="" className={`w-full h-full object-cover ${!slide.active ? "opacity-40" : ""}`} />
                <button onClick={() => handleDelete(slide.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-white">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 font-sans truncate">{slide.title || "Untitled"}</p>
                  <p className="text-xs text-stone-400 font-sans truncate">{slide.subtitle || "No subtitle"}</p>
                </div>
                <button
                  onClick={() => toggleActive(slide)}
                  className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                    slide.active ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {slide.active ? "Live" : "Hidden"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", rating: 5, text: "" });

  const fetchTestimonials = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/testimonials");
    const data = await res.json();
    if (data.success) setItems(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) { toast.error("Name and testimonial text required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Testimonial added");
        setForm({ name: "", location: "", rating: 5, text: "" });
        setShowForm(false);
        fetchTestimonials();
      } else {
        toast.error(data.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Testimonial) => {
    const res = await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    const data = await res.json();
    if (data.success) setItems((s) => s.map((x) => (x.id === item.id ? data.data : x)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Deleted"); setItems((s) => s.filter((x) => x.id !== id)); }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-medium text-stone-900">Testimonials</h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">Real customer reviews shown on the homepage</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} size="md" className="rounded-xl">
          <Plus className="w-4 h-4" /> Add Testimonial
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-5 mb-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-xs">Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Aisha K." className={inputCls} />
            </div>
            <div>
              <label className="label-xs">Location (optional)</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Srinagar" className={inputCls} />
            </div>
            <div>
              <label className="label-xs">Rating</label>
              <select value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: parseInt(e.target.value) }))} className={inputCls}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r !== 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Testimonial *</label>
              <textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="What did the customer say?" rows={3} className={inputCls} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={saving} size="md" className="rounded-xl">
                {saving ? "Saving…" : "Add Testimonial"}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => setShowForm(false)} className="rounded-xl border border-stone-200">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="h-24 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 py-10 flex flex-col items-center gap-2">
          <Star className="w-7 h-7 text-stone-300" />
          <p className="text-sm text-stone-400 font-sans">No testimonials yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm divide-y divide-stone-50">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between px-5 py-4 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-stone-900 font-sans">{item.name}</p>
                  {item.location && <span className="text-xs text-stone-400 font-sans">· {item.location}</span>}
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-stone-500 font-sans leading-relaxed">{item.text}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full ${
                    item.active ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {item.active ? "Live" : "Hidden"}
                </button>
                <button onClick={() => handleDelete(item.id)}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
