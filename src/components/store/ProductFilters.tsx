"use client";
// ─────────────────────────────────────────────────────────────────────────────
// components/store/ProductFilters.tsx
// Client component: search input, category tabs, sort select
// Replaces: toolbar + category-tabs + search-input + sort-select from collection.js
// Updates URL search params (no full page reload on filter change)
// ─────────────────────────────────────────────────────────────────────────────

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/format";
import type { Category } from "@prisma/client";

type Props = {
  categories: Category[];
  currentCategory: string;
  currentSort: string;
  currentSearch: string;
  colors?: { color: string; colorHex: string | null }[];
  currentColors?: string[];
};

const sortOptions = [
  { value: "featured",   label: "Featured" },
  { value: "newest",     label: "Newest" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export function ProductFilters({
  categories, currentCategory, currentSort, currentSearch,
  colors = [], currentColors = [],
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "featured") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset to page 1 on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const toggleColor = (color: string) => {
    const next = currentColors.includes(color)
      ? currentColors.filter((c) => c !== color)
      : [...currentColors, color];
    updateParam("color", next.join(","));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", search);
  };

  return (
    <div className={cn("space-y-4", isPending && "opacity-60 pointer-events-none transition-opacity")}>

      {/* ── Search + Sort row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search — replaces #search-input from collection.js */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => { if (search !== currentSearch) updateParam("search", search); }}
            placeholder="Search products…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 focus:border-transparent placeholder:text-stone-400"
          />
        </form>

        {/* Sort — replaces #sort-select from collection.js */}
        <div className="relative flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-stone-400 flex-shrink-0" />
          <select
            value={currentSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="pl-2 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 appearance-none cursor-pointer text-stone-700"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Category tabs — replaces .tab buttons from collection.js ── */}
      <div className="flex flex-wrap gap-2">
        {[{ slug: "all", name: "All" }, ...categories].map((cat) => (
          <button
            key={cat.slug}
            onClick={() => updateParam("category", cat.slug)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border font-sans",
              currentCategory === cat.slug
                ? "bg-souk-700 text-white border-souk-700 shadow-souk-sm"
                : "bg-white text-stone-600 border-stone-200 hover:border-souk-300 hover:text-souk-700"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Color filter — multi-select swatches ── */}
      {colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-500 font-sans mr-1">Color:</span>
          {colors.map(({ color, colorHex }) => {
            const active = currentColors.includes(color);
            return (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                title={color}
                className={cn(
                  "flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border text-xs font-medium font-sans transition-all",
                  active
                    ? "bg-souk-50 border-souk-300 text-souk-700"
                    : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: colorHex ?? "#d6d3d1" }}
                />
                {color}
              </button>
            );
          })}
        </div>
      )}

      {/* Active filters summary */}
      {(currentSearch || currentCategory !== "all" || currentColors.length > 0) && (
        <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
          <span>Filtering by:</span>
          {currentCategory !== "all" && (
            <span className="bg-souk-50 text-souk-700 px-2 py-0.5 rounded-full font-medium border border-souk-100">
              {categories.find((c) => c.slug === currentCategory)?.name ?? currentCategory}
            </span>
          )}
          {currentColors.map((c) => (
            <span key={c} className="bg-souk-50 text-souk-700 px-2 py-0.5 rounded-full font-medium border border-souk-100">
              {c}
            </span>
          ))}
          {currentSearch && (
            <span className="bg-souk-50 text-souk-700 px-2 py-0.5 rounded-full font-medium border border-souk-100">
              "{currentSearch}"
            </span>
          )}
          <a href="/products" className="ml-1 text-stone-400 hover:text-red-500 transition-colors underline">
            Clear all
          </a>
        </div>
      )}
    </div>
  );
}
