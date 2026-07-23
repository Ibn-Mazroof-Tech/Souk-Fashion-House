"use client";
// components/admin/AdminSidebarClient.tsx
// Sidebar with active link highlighting + mobile collapse

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, LogOut, ExternalLink, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/format";

const navItems = [
  { href: "/admin",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/orders",    label: "Orders",      icon: ShoppingBag },
  { href: "/admin/products",  label: "Products",    icon: Package },
  { href: "/admin/users",     label: "Users",       icon: Users },
  { href: "/admin/coupons",   label: "Coupons",     icon: Tag },
];

type Props = {
  userName: string;
  userEmail: string;
};

export function AdminSidebarClient({ userName, userEmail }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "bg-white border-r border-stone-100 flex flex-col transition-all duration-200 h-screen sticky top-0",
      collapsed ? "w-16" : "w-56"
    )}>
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-stone-100 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-souk-700 flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
              S
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-stone-900 leading-none">Souk</p>
              <p className="text-[10px] text-souk-700 tracking-widest uppercase font-sans leading-none mt-0.5">Admin</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-souk-700 flex items-center justify-center text-white font-display font-bold text-sm mx-auto">
            S
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-lg hover:bg-stone-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all font-sans",
                active
                  ? "bg-souk-50 text-souk-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("flex-shrink-0", active ? "w-4.5 h-4.5 text-souk-700" : "w-4.5 h-4.5")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        <div className="border-t border-stone-100 my-2 pt-2">
          <Link
            href="/"
            target="_blank"
            title={collapsed ? "View Store" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors font-sans",
              collapsed && "justify-center px-2"
            )}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0 text-stone-400" />
            {!collapsed && "View Store"}
          </Link>
        </div>
      </nav>

      {/* User + Logout */}
      <div className="border-t border-stone-100 p-3 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-souk-100 flex items-center justify-center text-souk-700 text-xs font-bold flex-shrink-0">
              {userName[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-900 truncate font-sans">{userName}</p>
              <p className="text-[10px] text-stone-400 truncate font-sans">{userEmail}</p>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors font-sans",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-14 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center shadow-sm text-stone-400 hover:text-stone-600 hover:bg-stone-50 z-10"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </aside>
  );
}
