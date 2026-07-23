// app/api/admin/products/route.ts
// GET  — paginated product list
// POST — create new product

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { toPaise } from "@/lib/utils/format";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, variants: true, colorImages: true, _count: { select: { orderItems: true } } },
      }),
      prisma.product.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = productSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );

    const { name, price, mrp, variants, colorImages, ...rest } = result.data;
    const slug = slugify(name);

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing)
      return NextResponse.json(
        { success: false, error: "A product with this name already exists" },
        { status: 409 }
      );

    // When variants are provided, they become the source of truth for stock —
    // the aggregate `stock` field is kept in sync (sum of variant stocks) so
    // existing stock badges/checks elsewhere in the app keep working.
    const hasVariants = variants && variants.length > 0;
    const aggregateStock = hasVariants
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : rest.stock;

    const product = await prisma.product.create({
      data: {
        ...rest,
        name,
        slug,
        price: toPaise(price),  // Admin inputs in rupees, we store paise
        mrp: toPaise(mrp),
        stock: aggregateStock,
        ...(hasVariants && {
          variants: { create: variants.map((v) => ({ ...v, colorHex: v.colorHex || null })) },
        }),
        ...(colorImages && colorImages.length > 0 && {
          colorImages: { create: colorImages },
        }),
      },
      include: { category: true, variants: true, colorImages: true },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}
