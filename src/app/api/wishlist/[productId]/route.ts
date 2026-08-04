// app/api/wishlist/[productId]/route.ts — toggle wishlist item
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: session.user.id, productId: params.productId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, data: { wishlisted: false } });
    } else {
      await prisma.wishlist.create({
        data: { userId: session.user.id, productId: params.productId },
      });
      return NextResponse.json({ success: true, data: { wishlisted: true } });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update wishlist" }, { status: 500 });
  }
}
