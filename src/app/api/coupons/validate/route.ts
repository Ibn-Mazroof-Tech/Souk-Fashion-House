// app/api/coupons/validate/route.ts
// GET /api/coupons/validate?code=WELCOME10&amount=299900
// Public — validates coupon and returns discount amount

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")?.toUpperCase();
    const amount = parseInt(req.nextUrl.searchParams.get("amount") ?? "0");

    if (!code) return NextResponse.json({ success: false, error: "Coupon code required" }, { status: 400 });

    const coupon = await prisma.coupon.findFirst({
      where: {
        code,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!coupon) return NextResponse.json({ success: false, error: "Invalid or expired coupon" }, { status: 404 });
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      return NextResponse.json({ success: false, error: "Coupon usage limit reached" }, { status: 400 });
    if (amount < coupon.minOrder)
      return NextResponse.json({
        success: false,
        error: `Minimum order ₹${coupon.minOrder / 100} required for this coupon`,
      }, { status: 400 });

    const discount = coupon.type === "percent"
      ? Math.round((amount * coupon.value) / 100)
      : coupon.value;

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        finalAmount: Math.max(0, amount - discount),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Validation failed" }, { status: 500 });
  }
}
