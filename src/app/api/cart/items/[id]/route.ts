// app/api/cart/items/[id]/route.ts
// PATCH  — update qty (delta +1 or -1)
// DELETE — remove item from cart

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCartSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = updateCartSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    // Ensure item belongs to this user
    const existing = await prisma.cartItem.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!existing)
      return NextResponse.json({ success: false, error: "Cart item not found" }, { status: 404 });

    const newQty = existing.qty + result.data.delta;

    // If qty drops to 0, remove the item
    if (newQty <= 0) {
      await prisma.cartItem.delete({ where: { id: params.id } });
      return NextResponse.json({ success: true, data: null });
    }

    const updated = await prisma.cartItem.update({
      where: { id: params.id },
      data: { qty: newQty },
      include: { product: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await prisma.cartItem.deleteMany({
      where: { id: params.id, userId: session.user.id },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to remove item" }, { status: 500 });
  }
}
