// ─────────────────────────────────────────────────────────────────────────────
// app/api/admin/analytics/route.ts
// GET — Dashboard analytics: revenue, orders, top products, daily chart
//
// Replaces: localStorage revenue/order stats from original admin.js
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all queries in parallel for performance
    const [
      totalOrders,
      paidOrders,
      codOrders,
      revenueResult,
      topProductsRaw,
      recentOrdersByDay,
      totalUsers,
    ] = await Promise.all([
      // Total order count
      prisma.order.count(),

      // Paid orders count
      prisma.order.count({ where: { paymentStatus: "PAID" } }),

      // COD orders count
      prisma.order.count({ where: { paymentMethod: "COD" } }),

      // Total revenue (from paid orders only, in paise)
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { total: true },
      }),

      // Top selling products (by units sold)
      prisma.orderItem.groupBy({
        by: ["productId", "name", "image"],
        _sum: { qty: true, price: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5,
      }),

      // Orders + revenue per day (last 30 days)
      prisma.$queryRaw<{ date: string; orders: number; revenue: number }[]>`
        SELECT 
          DATE(created_at)::text as date,
          COUNT(*)::int as orders,
          COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total ELSE 0 END), 0)::int as revenue
        FROM orders
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `,

      // Total registered users
      prisma.user.count({ where: { role: "CUSTOMER" } }),
    ]);

    // Format top products
    const topProducts = topProductsRaw.map((p) => ({
      productId: p.productId,
      name: p.name,
      image: p.image,
      totalSold: p._sum.qty ?? 0,
      revenue: p._sum.price ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: revenueResult._sum.total ?? 0,
        totalOrders,
        paidOrders,
        codOrders,
        pendingOrders: totalOrders - paidOrders,
        totalUsers,
        topProducts,
        revenueByDay: recentOrdersByDay,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
