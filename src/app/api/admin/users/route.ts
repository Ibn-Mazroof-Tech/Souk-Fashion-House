// app/api/admin/users/route.ts — list all users with order counts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminCreateUserSchema } from "@/lib/validations";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = adminCreateUserSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const { name, email, phone, role, password } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ success: false, error: "A user with this email already exists" }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
        password: password ? await bcrypt.hash(password, 12) : null,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: { ...user, _count: { orders: 0 } } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}
