// app/(account)/layout.tsx — Wraps all account pages with Navbar/Footer
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
