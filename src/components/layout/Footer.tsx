// components/layout/Footer.tsx

import Link from "next/link";
import { MessageCircle, Instagram, Mail } from "lucide-react";

const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-16">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-souk-700 flex items-center justify-center text-white font-display font-bold text-base">
                S
              </div>
              <div>
                <span className="font-display font-semibold text-lg text-white block leading-none">Souk</span>
                <span className="text-[10px] text-souk-400 tracking-[0.15em] uppercase font-sans leading-none">Fashion House</span>
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
              Authentic ethnic wear — Kashmiri pherans, Pakistani suits, and pashmina shawls. Crafted with heritage, delivered with care.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="mailto:hello@soukfashionhouse.com" className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-colors" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Shop</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/products", label: "All Collections" },
                { href: "/products?category=pherans", label: "Pherans" },
                { href: "/products?category=pakistani", label: "Pakistani Suits" },
                { href: "/products?category=shawls", label: "Shawls" },
                { href: "/products?featured=true", label: "Featured Items" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-stone-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Support</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/orders/track", label: "Track Order" },
                { href: "/account/orders", label: "My Orders" },
                { href: `https://wa.me/${waNumber}?text=Hi, I need help with my order`, label: "WhatsApp Support" },
                { href: "/account", label: "My Account" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-stone-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Policies</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                "Shipping Policy",
                "Returns & Exchange",
                "Privacy Policy",
                "Terms of Service",
              ].map((l) => (
                <li key={l}>
                  <span className="text-stone-500 cursor-default">{l}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 space-y-1.5 text-xs text-stone-500">
              <p>📦 Dispatch: 24–48 hrs</p>
              <p>🚚 Delivery: 3–7 business days</p>
              <p>🔄 7-day size exchange</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-stone-600">
            © {new Date().getFullYear()} Souk Fashion House. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-stone-600">
            <span>🔒 Secured by Razorpay</span>
            <span>📍 Delhi, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
