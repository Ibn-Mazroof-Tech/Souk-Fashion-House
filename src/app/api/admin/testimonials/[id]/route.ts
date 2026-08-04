// app/api/admin/testimonials/[id]/route.ts — update or delete a testimonial
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testimonialSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const partialResult = testimonialSchema.partial().safeParse(body);
    if (!partialResult.success)
      return NextResponse.json({ success: false, error: partialResult.error.errors[0].message }, { status: 400 });

    const testimonial = await prisma.testimonial.update({
      where: { id: params.id },
      data: {
        ...partialResult.data,
        ...(typeof body.sortOrder === "number" && { sortOrder: body.sortOrder }),
      },
    });
    return NextResponse.json({ success: true, data: testimonial });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.testimonial.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete testimonial" }, { status: 500 });
  }
}
