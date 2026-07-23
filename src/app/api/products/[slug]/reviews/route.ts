// ─────────────────────────────────────────────────────────────────────────────
// app/api/products/[slug]/reviews/route.ts
// GET  — fetch reviews for a product
// POST — submit a review (auth required)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!product)
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ success: false, error: "Sign in to leave a review" }, { status: 401 });

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!product)
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });

    const body = await req.json();
    const result = reviewSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    // Check if user has purchased this product (for "verified buyer" badge)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { userId: session.user.id, paymentStatus: "PAID" },
      },
    });

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: session.user.id, productId: product.id } },
      update: { ...result.data },
      create: {
        userId: session.user.id,
        productId: product.id,
        verified: !!hasPurchased,
        ...result.data,
      },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/products/:slug/reviews]", error);
    return NextResponse.json({ success: false, error: "Failed to submit review" }, { status: 500 });
  }
}
