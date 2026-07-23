// ─────────────────────────────────────────────────────────────────────────────
// lib/prisma.ts — Prisma Client Singleton
//
// In Next.js dev mode, hot reloads create new PrismaClient instances each time,
// which exhausts the database connection pool. This singleton pattern prevents
// that by reusing the same client across hot reloads.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
