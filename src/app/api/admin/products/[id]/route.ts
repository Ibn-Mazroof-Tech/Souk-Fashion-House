// app/api/admin/products/[id]/route.ts
// PATCH  — update product
// DELETE — soft delete (set active: false)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { toPaise } from "@/lib/utils/format";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const result = productSchema.partial().safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const { price, mrp, variants, colorImages, ...rest } = result.data;

    // If variants are being updated, replace the whole set inside a
    // transaction (simplest way to keep sizes/colors/stock consistent) and
    // recompute the aggregate stock field to match. Same replace-whole-set
    // approach for colorImages.
    const product = await prisma.$transaction(async (tx) => {
      if (variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: params.id } });
        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map((v) => ({
              productId: params.id,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex || null,
              stock: v.stock,
            })),
          });
        }
      }

      if (colorImages !== undefined) {
        await tx.productColorImage.deleteMany({ where: { productId: params.id } });
        if (colorImages.length > 0) {
          await tx.productColorImage.createMany({
            data: colorImages.map((ci) => ({
              productId: params.id,
              color: ci.color,
              images: ci.images,
            })),
          });
        }
      }

      const aggregateStock =
        variants !== undefined
          ? variants.reduce((sum, v) => sum + v.stock, 0)
          : rest.stock;

      return tx.product.update({
        where: { id: params.id },
        data: {
          ...rest,
          ...(aggregateStock !== undefined && { stock: aggregateStock }),
          ...(price !== undefined && { price: toPaise(price) }),
          ...(mrp !== undefined && { mrp: toPaise(mrp) }),
        },
        include: { category: true, variants: true, colorImages: true },
      });
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft delete — just deactivate, preserve order history
    await prisma.product.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
