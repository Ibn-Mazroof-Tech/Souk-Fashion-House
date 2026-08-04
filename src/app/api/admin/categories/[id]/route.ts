// app/api/admin/categories/[id]/route.ts — rename or delete a category
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });

    const trimmed = name.trim();
    const baseSlug = slugify(trimmed);

    const current = await prisma.category.findUnique({
      where: { id: params.id },
      select: { parentId: true, parent: { select: { slug: true } } },
    });
    if (!current)
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });

    // Children keep their parent-prefixed slug scheme on rename too (e.g.
    // renaming "Kashmiri" under Kurtis stays "kurtis-<new-name>"). Note:
    // renaming a PARENT does not cascade a new prefix onto its existing
    // children — their slugs keep the old prefix, which still works fine
    // since slugs only need to stay unique, just a minor cosmetic mismatch.
    const slug = current.parent ? `${current.parent.slug}-${baseSlug}` : baseSlug;

    const clash = await prisma.category.findFirst({
      where: {
        id: { not: params.id },
        parentId: current.parentId,
        OR: [{ name: trimmed }, { slug }],
      },
    });
    if (clash)
      return NextResponse.json(
        { success: false, error: `A category named "${clash.name}" already exists` },
        { status: 409 }
      );

    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name: trimmed, slug },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({ success: true, data: category });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: { name: true, _count: { select: { products: true, children: true } } },
    });
    if (!category)
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });

    if (category._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Can't delete "${category.name}" — it has ${category._count.children} sub-categor${category._count.children !== 1 ? "ies" : "y"}. Delete those first.`,
        },
        { status: 400 }
      );
    }

    // Deleting a category only removes the tag (ProductCategory join row,
    // which cascades automatically) — the products themselves are never
    // touched. A product left with no categories at all just becomes
    // "uncategorized"; if it was tagged under other categories too, those
    // stay exactly as they were.
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, data: { productsAffected: category._count.products } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
  }
}
