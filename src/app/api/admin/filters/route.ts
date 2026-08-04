// app/api/admin/filters/route.ts — list all filter attributes (with values), create new
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterAttributeSchema } from "@/lib/validations";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");
}

export async function GET() {
  try {
    const attributes = await prisma.filterAttribute.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        values: {
          orderBy: { value: "asc" },
          include: { _count: { select: { products: true } } },
        },
      },
    });
    return NextResponse.json({ success: true, data: attributes });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch filters" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = filterAttributeSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const { name, type } = result.data;
    const slug = slugify(name);

    const existing = await prisma.filterAttribute.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (existing)
      return NextResponse.json(
        { success: false, error: `A filter named "${existing.name}" already exists` },
        { status: 409 }
      );

    const attribute = await prisma.filterAttribute.create({
      data: { name, slug, type },
      include: { values: { include: { _count: { select: { products: true } } } } },
    });

    return NextResponse.json({ success: true, data: attribute }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create filter" }, { status: 500 });
  }
}
