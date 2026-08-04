// app/api/admin/hero-slides/[id]/route.ts — update or delete a hero slide
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { heroSlideSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const partialResult = heroSlideSchema.partial().safeParse(body);
    if (!partialResult.success)
      return NextResponse.json({ success: false, error: partialResult.error.errors[0].message }, { status: 400 });

    const slide = await prisma.heroSlide.update({
      where: { id: params.id },
      data: {
        ...partialResult.data,
        ...(typeof body.sortOrder === "number" && { sortOrder: body.sortOrder }),
      },
    });
    return NextResponse.json({ success: true, data: slide });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update hero slide" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.heroSlide.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete hero slide" }, { status: 500 });
  }
}
