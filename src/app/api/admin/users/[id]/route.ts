// app/api/admin/users/[id]/route.ts — update role/details or delete a user
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminUpdateUserSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const result = adminUpdateUserSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });

    const { name, phone, role } = result.data;

    // Guard: don't let an admin demote themselves — avoids accidentally
    // locking everyone out if they're the only admin online
    if (role && role !== "ADMIN" && session?.user?.id === params.id) {
      return NextResponse.json(
        { success: false, error: "You can't remove your own admin access" },
        { status: 400 }
      );
    }

    // Guard: don't let the last remaining admin get demoted at all
    if (role && role !== "ADMIN") {
      const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
      if (target?.role === "ADMIN") {
        const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          return NextResponse.json(
            { success: false, error: "Can't remove the last remaining admin" },
            { status: 400 }
          );
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(role !== undefined && { role }),
      },
      select: {
        id: true, name: true, email: true, phone: true, role: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.id === params.id) {
      return NextResponse.json(
        { success: false, error: "You can't delete your own account" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true, _count: { select: { orders: true, reviews: true } } },
    });
    if (!target)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Can't delete the last remaining admin" },
          { status: 400 }
        );
      }
    }

    // Orders and reviews are real business records — block deletion rather
    // than silently orphaning/cascading them, so history stays intact.
    if (target._count.orders > 0 || target._count.reviews > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Can't delete — this user has ${target._count.orders} order(s) and ${target._count.reviews} review(s). Change their role instead if needed.`,
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
