// ─────────────────────────────────────────────────────────────────────────────
// app/layout.tsx — Root Layout
// Wraps every page with: Fonts, Providers, Toaster
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Souk Fashion House — Ethnic Wear & Kashmir Collection",
    template: "%s | Souk Fashion House",
  },
  description:
    "Discover premium Kashmiri pherans, Pakistani suits, and pashmina shawls. Authentic ethnic wear delivered across India.",
  keywords: ["kashmiri pheran", "pakistani suits", "pashmina shawl", "ethnic wear", "souk fashion"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Souk Fashion House",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="bg-cream-50 text-stone-900 antialiased">
        <Providers>
          {children}
          {/* Toast notifications — replaces original toast() utility */}
          <Toaster
            position="top-right"
            offset={80}
            toastOptions={{
              style: {
                background: "#1a1208",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "14px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
