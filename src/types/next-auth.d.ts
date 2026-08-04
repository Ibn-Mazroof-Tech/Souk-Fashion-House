// ─────────────────────────────────────────────────────────────────────────────
// types/next-auth.d.ts — Extend NextAuth Session & JWT types
//
// By default, session.user only has { name, email, image }.
// We extend it to include id and role so admin guards work cleanly.
// ─────────────────────────────────────────────────────────────────────────────

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "CUSTOMER" | "ADMIN";
    };
  }

  interface User {
    id: string;
    role: "CUSTOMER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "CUSTOMER" | "ADMIN";
  }
}
