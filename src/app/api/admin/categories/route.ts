// app/api/admin/categories/route.ts — list all categories
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    const trimmed = name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: trimmed }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A category named "${existing.name}" already exists` },
        { status: 409 }
      );
    }

    const cat = await prisma.category.create({ data: { name: trimmed, slug } });
    return NextResponse.json({ success: true, data: cat }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}
