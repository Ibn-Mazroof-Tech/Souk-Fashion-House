// ─────────────────────────────────────────────────────────────────────────────
// middleware.ts — Route Protection
//
// Protects:
//   /admin/**      → requires ADMIN role
//   /account/**    → requires any authenticated user
//   /checkout      → requires authentication (redirect to login with callbackUrl)
//   /wishlist      → requires authentication
//
// Replaces: email whitelist check in original admin.js
// ─────────────────────────────────────────────────────────────────────────────

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // ── Admin routes: require ADMIN role ────────────────────────────────────
    if (pathname.startsWith("/admin")) {
      if (!token || token.role !== "ADMIN") {
        // Redirect non-admins to home with an error message
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("error", "admin_required");
        return NextResponse.redirect(url);
      }
    }

    // ── Admin API routes: also require ADMIN role ────────────────────────────
    if (pathname.startsWith("/api/admin")) {
      if (!token || token.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      // Explicit — without this, an unauthenticated hit on a protected route
      // bounces through NextAuth's default /api/auth/signin before landing
      // on our custom page, which is an extra hop that can misbehave.
      signIn: "/login",
    },
    callbacks: {
      // Only run the middleware function above if user is logged in
      // For routes that just need authentication (not specific roles),
      // withAuth handles the redirect to /login automatically
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Admin requires login + ADMIN role (handled above)
        if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
          return !!token;
        }

        // Account pages require any login
        if (pathname.startsWith("/account")) {
          return !!token;
        }

        // All other protected routes
        return !!token;
      },
    },
  }
);

// Apply middleware to these paths
export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/checkout",
    "/wishlist",
    "/api/admin/:path*",
    "/api/cart/:path*",
    "/api/wishlist/:path*",
    "/api/orders",
  ],
};
