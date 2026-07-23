// ─────────────────────────────────────────────────────────────────────────────
// app/api/products/route.ts
// GET /api/products?category=pherans&search=kashmiri&sort=price-asc&page=1&limit=12
//
// Replaces: in-memory filter logic from collection.js
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "featured";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(24, parseInt(searchParams.get("limit") || "12"));
    const featuredOnly = searchParams.get("featured") === "true";

    // ── Build where clause ─────────────────────────────────────────────────
    const where: Prisma.ProductWhereInput = {
      active: true, // Only show active products
    };

    if (category !== "all") {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (featuredOnly) {
      where.featured = true;
    }

    // ── Build orderBy clause ───────────────────────────────────────────────
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sort) {
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "featured":
      default:
        orderBy = { featured: "desc" };
    }

    // ── Execute query with count for pagination ────────────────────────────
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true, slug: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products — Admin only (also handled in /api/admin/products)
// This is a convenience alias; actual admin check done in admin routes
