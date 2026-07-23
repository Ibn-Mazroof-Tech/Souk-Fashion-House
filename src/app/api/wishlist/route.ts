// app/api/wishlist/route.ts — GET user wishlist
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: { category: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: wishlist });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch wishlist" }, { status: 500 });
  }
}
