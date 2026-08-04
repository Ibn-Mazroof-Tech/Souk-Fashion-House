// app/api/admin/orders/[id]/status/route.ts
// PATCH — update order status

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["ORDERED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success)
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status: result.data.status },
      select: { id: true, orderId: true, status: true },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
