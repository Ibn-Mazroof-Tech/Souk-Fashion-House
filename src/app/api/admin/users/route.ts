// app/api/admin/users/route.ts — list all users with order counts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
    const search = req.nextUrl.searchParams.get("search") ?? "";

    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
        select: {
          id: true, name: true, email: true, phone: true, role: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { users, pagination: { page, total, pages: Math.ceil(total / 20) } },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}
