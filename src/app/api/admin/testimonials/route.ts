// app/api/admin/testimonials/route.ts — list all testimonials, create new
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { testimonialSchema } from "@/lib/validations";

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ success: true, data: testimonials });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = testimonialSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const count = await prisma.testimonial.count();
    const testimonial = await prisma.testimonial.create({
      data: { ...result.data, sortOrder: count },
    });
    return NextResponse.json({ success: true, data: testimonial }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create testimonial" }, { status: 500 });
  }
}
