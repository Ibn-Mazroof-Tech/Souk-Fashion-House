// app/api/admin/filters/[id]/route.ts — rename or delete a filter attribute
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Cascades to values and product tags — that's intentional for a filter
    // (unlike Category, an attribute isn't a required field on Product)
    await prisma.filterAttribute.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete filter" }, { status: 500 });
  }
}
