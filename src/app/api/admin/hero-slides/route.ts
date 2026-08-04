// app/api/admin/hero-slides/route.ts — list all hero slides, create new
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { heroSlideSchema } from "@/lib/validations";

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ success: true, data: slides });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch hero slides" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = heroSlideSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const count = await prisma.heroSlide.count();
    if (count >= 5)
      return NextResponse.json(
        { success: false, error: "Maximum 5 hero slides — delete one before adding another" },
        { status: 400 }
      );

    const slide = await prisma.heroSlide.create({
      data: { ...result.data, sortOrder: count },
    });
    return NextResponse.json({ success: true, data: slide }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create hero slide" }, { status: 500 });
  }
}
