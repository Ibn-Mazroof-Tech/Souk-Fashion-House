// app/api/orders/route.ts — GET authenticated user's order history
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: { name: true, image: true, size: true, qty: true, price: true },
        },
        payment: { select: { razorpayPaymentId: true, status: true } },
      },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}
