// ─────────────────────────────────────────────────────────────────────────────
// components/layout/Navbar.tsx
// Sticky navbar with: logo, nav links, cart badge, user menu, mobile hamburger
// Replaces: renderShell() + updateBadge() from original common.js
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, Menu, X, User, LogOut, Package, Heart, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils/format";

const navLinks = [
  { href: "/products", label: "Collections" },
  { href: "/products?category=pherans", label: "Pherans" },
  { href: "/products?category=pakistani", label: "Pakistani Suits" },
  { href: "/products?category=shawls", label: "Shawls" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.itemCount());
  const { openCart, mobileMenuOpen, openMobileMenu, closeMobileMenu } = useUIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-100",
        "transition-shadow duration-200",
        scrolled && "shadow-souk-sm"
      )}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-souk-700 flex items-center justify-center text-white font-display font-bold text-base group-hover:bg-souk-800 transition-colors">
              S
            </div>
            <div>
              <span className="font-display font-semibold text-lg text-stone-900 leading-none block">
                Souk
              </span>
              <span className="text-[10px] text-souk-700 tracking-[0.15em] uppercase font-sans font-medium leading-none">
                Fashion House
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors font-sans",
                  pathname === link.href || pathname.startsWith(link.href.split("?")[0])
                    ? "bg-souk-50 text-souk-700"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-1">

            {/* Cart button with badge — replaces updateBadge() */}
            <button
              onClick={openCart}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-stone-50 transition-colors group"
              aria-label={`Cart (${itemCount} items)`}
            >
              <ShoppingBag className="w-5 h-5 text-stone-700 group-hover:text-souk-700 transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-souk-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-slide-up">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-stone-600" />
                )}
                <span className="text-sm font-medium text-stone-700 max-w-[100px] truncate">
                  {session?.user?.name?.split(" ")[0] ?? "Account"}
                </span>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-stone-100 rounded-xl shadow-souk-md py-1.5 animate-slide-up z-50">
                  {session ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-stone-50">
                        <p className="text-sm font-semibold text-stone-900 truncate">{session.user.name}</p>
                        <p className="text-xs text-stone-500 truncate">{session.user.email}</p>
                      </div>
                      <Link href="/account" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User className="w-4 h-4 text-stone-400" /> My Account
                      </Link>
                      <Link href="/account/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Package className="w-4 h-4 text-stone-400" /> My Orders
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Heart className="w-4 h-4 text-stone-400" /> Wishlist
                      </Link>
                      {session.user.role === "ADMIN" && (
                        <>
                          <div className="border-t border-stone-50 my-1" />
                          <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-souk-700 hover:bg-souk-50 transition-colors font-medium" onClick={() => setUserMenuOpen(false)}>
                            <Settings className="w-4 h-4" /> Admin Panel
                          </Link>
                        </>
                      )}
                      <div className="border-t border-stone-50 my-1" />
                      <button
                        onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors font-medium" onClick={() => setUserMenuOpen(false)}>
                        Sign In
                      </Link>
                      <Link href="/register" className="flex items-center gap-2 px-4 py-2.5 text-sm text-souk-700 hover:bg-souk-50 transition-colors font-medium" onClick={() => setUserMenuOpen(false)}>
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => mobileMenuOpen ? closeMobileMenu() : openMobileMenu()}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-stone-50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-stone-700" />
              ) : (
                <Menu className="w-5 h-5 text-stone-700" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile menu drawer ── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 py-3 pb-5 space-y-1 animate-slide-up">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-souk-50 text-souk-700"
                    : "text-stone-700 hover:bg-stone-50"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-stone-100 space-y-1">
              {session ? (
                <>
                  <Link href="/account/orders" onClick={closeMobileMenu} className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                  <Link href="/wishlist" onClick={closeMobileMenu} className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">
                    <Heart className="w-4 h-4" /> Wishlist
                  </Link>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin" onClick={closeMobileMenu} className="flex items-center gap-2 px-3 py-2.5 text-sm text-souk-700 font-medium hover:bg-souk-50 rounded-lg">
                      <Settings className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={closeMobileMenu} className="flex items-center px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg">Sign In</Link>
                  <Link href="/register" onClick={closeMobileMenu} className="flex items-center px-3 py-2.5 text-sm font-semibold text-souk-700 hover:bg-souk-50 rounded-lg">Create Account</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
