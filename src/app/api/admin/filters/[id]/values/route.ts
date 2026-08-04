// app/api/admin/filters/[id]/values/route.ts — add a value to a filter attribute
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterAttributeValueSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const result = filterAttributeValueSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const { value, colorHex } = result.data;

    const existing = await prisma.filterAttributeValue.findFirst({
      where: { attributeId: params.id, value },
    });
    if (existing)
      return NextResponse.json({ success: false, error: `"${value}" already exists on this filter` }, { status: 409 });

    const created = await prisma.filterAttributeValue.create({
      data: { attributeId: params.id, value, colorHex: colorHex || null },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to add value" }, { status: 500 });
  }
}
