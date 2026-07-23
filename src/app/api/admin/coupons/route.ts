// app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { couponSchema } from "@/lib/validations";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data: coupons });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = couponSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const coupon = await prisma.coupon.create({ data: result.data });
    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002")
      return NextResponse.json({ success: false, error: "Coupon code already exists" }, { status: 409 });
    return NextResponse.json({ success: false, error: "Failed to create coupon" }, { status: 500 });
  }
}
