// app/api/admin/filters/[id]/values/[valueId]/route.ts — delete a single filter value
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; valueId: string } }
) {
  try {
    await prisma.filterAttributeValue.delete({ where: { id: params.valueId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete value" }, { status: 500 });
  }
}
