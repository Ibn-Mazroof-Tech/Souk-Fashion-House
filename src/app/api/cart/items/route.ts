// app/api/cart/items/route.ts
// POST — add item to cart

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addToCartSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = addToCartSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const { productId, size, qty } = result.data;

    // Verify product exists and is active
    const product = await prisma.product.findFirst({
      where: { id: productId, active: true },
    });
    if (!product)
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });

    // Check stock
    if (product.stock < qty)
      return NextResponse.json({ success: false, error: "Insufficient stock" }, { status: 400 });

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId_size: { userId: session.user.id, productId, size },
      },
      update: { qty: { increment: qty } },
      create: { userId: session.user.id, productId, size, qty },
      include: { product: true },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/cart/items]", error);
    return NextResponse.json({ success: false, error: "Failed to add to cart" }, { status: 500 });
  }
}
