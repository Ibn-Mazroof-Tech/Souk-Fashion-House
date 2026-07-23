"use client";
// ─────────────────────────────────────────────────────────────────────────────
// components/admin/AdminRevenueChart.tsx
// Client component — fetches /api/admin/analytics and renders Recharts chart
// Replaces: "Popular products chart placeholder" from admin.js
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import { TrendingUp, BarChart2 } from "lucide-react";

type DayData = {
  date: string;
  revenue: number;
  orders: number;
};

type ChartMode = "revenue" | "orders";

// Custom tooltip — shows INR formatted amount
function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="bg-white border border-stone-100 rounded-xl shadow-souk-md px-4 py-3">
      <p className="text-xs text-stone-500 font-sans mb-1">{label}</p>
      <p className="text-sm font-bold text-stone-900 font-sans">
        {mode === "revenue" ? `₹${(value / 100).toLocaleString("en-IN")}` : `${value} orders`}
      </p>
    </div>
  );
}

export function AdminRevenueChart() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ChartMode>("revenue");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          // Format dates to be readable: "Apr 12" style
          const formatted = (d.data.revenueByDay as DayData[]).map((item) => ({
            ...item,
            date: new Date(item.date).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            }),
          }));
          setData(formatted);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-lg font-medium text-stone-900">
            {mode === "revenue" ? "Revenue" : "Orders"} — Last 30 Days
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Daily {mode === "revenue" ? "revenue (₹)" : "order count"}
          </p>
        </div>
        {/* Toggle revenue / orders */}
        <div className="flex items-center bg-stone-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode("revenue")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-sans ${
              mode === "revenue"
                ? "bg-white text-souk-700 shadow-souk-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Revenue
          </button>
          <button
            onClick={() => setMode("orders")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-sans ${
              mode === "orders"
                ? "bg-white text-souk-700 shadow-souk-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Orders
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-souk-200 border-t-souk-700 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart2 className="w-10 h-10 text-stone-200 mx-auto mb-3" />
            <p className="text-sm text-stone-400 font-sans">No data yet — orders will appear here</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          {mode === "revenue" ? (
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="soukGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b3d3d" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b3d3d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f0ec" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9b8573", fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9b8573", fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 100).toLocaleString("en-IN")}`}
                width={70}
              />
              <Tooltip content={<CustomTooltip mode="revenue" />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8b3d3d"
                strokeWidth={2}
                fill="url(#soukGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "#8b3d3d", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f0ec" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9b8573", fontFamily: "DM Sans" }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9b8573", fontFamily: "DM Sans" }}
                axisLine={false} tickLine={false}
                width={35} allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip mode="orders" />} />
              <Bar
                dataKey="orders"
                fill="#8b3d3d"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
