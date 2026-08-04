// app/(store)/layout.tsx — Store layout wrapping all public store pages

import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
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

      {/* WhatsApp floating button — preserved from original project */}
      <a
        href={`https://wa.me/${waNumber}?text=Hi, I need help with an order`}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-wa"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">WhatsApp</span>
      </a>
    </>
  );
}
