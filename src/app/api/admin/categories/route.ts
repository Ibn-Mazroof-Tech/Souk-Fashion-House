// app/api/admin/categories/route.ts — list all categories (with children), create new
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: true } },
        children: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } },
      },
    });
    // Return only top-level categories at the root — each carries its own
    // `children` array, so the admin UI can render the full tree
    const topLevel = categories.filter((c) => !c.parentId);
    return NextResponse.json({ success: true, data: topLevel });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, parentId } = await req.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    const trimmed = name.trim();
    const baseSlug = trimmed.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");

    let parent: { id: string; slug: string; parentId: string | null } | null = null;
    if (parentId) {
      parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json({ success: false, error: "Parent category not found" }, { status: 400 });
      }
      // Sub-categories can't have their own sub-categories — keep it 2 levels
      if (parent.parentId) {
        return NextResponse.json(
          { success: false, error: "Only 2 levels are supported — pick a top-level category as the parent" },
          { status: 400 }
        );
      }
    }

    // Slug: top-level categories use their own slug; children get it
    // prefixed with the parent's slug (e.g. "kurtis-kashmiri") so the same
    // display name can be reused under different parents without colliding.
    const slug = parent ? `${parent.slug}-${baseSlug}` : baseSlug;

    // Name only needs to be unique among siblings (same parent) — "Kashmiri"
    // can exist under both Kurtis and Shawls. Top-level names are checked
    // against other top-level categories only.
    const existing = await prisma.category.findFirst({
      where: { parentId: parentId || null, OR: [{ name: trimmed }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: parent
            ? `"${existing.name}" already exists under ${parent.slug}`
            : `A category named "${existing.name}" already exists`,
        },
        { status: 409 }
      );
    }

    const cat = await prisma.category.create({
      data: { name: trimmed, slug, parentId: parentId || null },
      include: { _count: { select: { products: true } }, children: true },
    });
    return NextResponse.json({ success: true, data: cat }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}
