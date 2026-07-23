// ─────────────────────────────────────────────────────────────────────────────
// app/api/cart/route.ts
// GET    — fetch user's DB cart
// DELETE — clear entire cart (called after order placement)
// POST   — merge guest cart into DB cart (called on login)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: { category: { select: { name: true, slug: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to clear cart" }, { status: 500 });
  }
}

// POST /api/cart — merge guest localStorage cart into DB on login
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { items } = await req.json() as {
      items: { productId: string; size: string; qty: number }[];
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Upsert each guest cart item into DB
    // If item already exists, take the higher quantity
    for (const item of items) {
      await prisma.cartItem.upsert({
        where: {
          userId_productId_size: {
            userId: session.user.id,
            productId: item.productId,
            size: item.size,
          },
        },
        update: {
          // On conflict, increment qty (merge strategy)
          qty: { increment: item.qty },
        },
        create: {
          userId: session.user.id,
          productId: item.productId,
          size: item.size,
          qty: item.qty,
        },
      });
    }

    // Return merged cart
    const mergedCart = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true },
    });

    return NextResponse.json({ success: true, data: mergedCart });
  } catch (error) {
    console.error("[POST /api/cart merge]", error);
    return NextResponse.json({ success: false, error: "Failed to merge cart" }, { status: 500 });
  }
}
