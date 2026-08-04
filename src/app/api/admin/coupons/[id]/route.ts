// app/api/admin/coupons/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const coupon = await prisma.coupon.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ success: true, data: coupon });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.coupon.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete coupon" }, { status: 500 });
  }
}
