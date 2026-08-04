// app/(account)/layout.tsx — Wraps all account pages with Navbar/Footer
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { prisma } from "@/lib/prisma";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true, children: { orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } } },
  });

  return (
    <>
      <Suspense fallback={null}>
        <Navbar categories={categories} />
      </Suspense>
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
