// app/(store)/layout.tsx — Store layout wrapping all public store pages

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { MessageCircle } from "lucide-react";

const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
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
