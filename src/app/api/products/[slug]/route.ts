// ─────────────────────────────────────────────────────────────────────────────
// app/api/products/[slug]/route.ts
// GET /api/products/classic-kashmiri-pheran
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug, active: true },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: { select: { reviews: true, wishlist: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch related products from same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        active: true,
      },
      take: 4,
      include: { category: { select: { name: true, slug: true } } },
    });

    // Compute average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        : null;

    return NextResponse.json({
      success: true,
      data: { product: { ...product, avgRating }, related },
    });
  } catch (error) {
    console.error("[GET /api/products/:slug]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
