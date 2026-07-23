// ─────────────────────────────────────────────────────────────────────────────
// lib/auth.ts — NextAuth Configuration
//
// Providers: Google OAuth + Email/Password (Credentials)
// Adapter: Prisma (persists sessions and accounts to PostgreSQL)
// Session strategy: JWT (works with Vercel Edge)
// ─────────────────────────────────────────────────────────────────────────────

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  // Use Prisma to persist users, accounts, and sessions to the database
  adapter: PrismaAdapter(prisma) as Adapter,

  // JWT strategy — works on Vercel's Edge runtime without sticky sessions
  session: {
    strategy: "jwt",
    // Session expires after 30 days of inactivity
    maxAge: 30 * 24 * 60 * 60,
  },

  providers: [
    // ── Google OAuth ────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email + Password ────────────────────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password) {
          // Don't reveal whether email exists — generic message
          throw new Error("Invalid email or password");
        }

        // Compare hashed password
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    // Called when JWT is created/updated. Embed role in the token.
    async jwt({ token, user, trigger, session }) {
      // On initial sign in, user object is available
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }

      // Handle session updates (e.g. profile edit)
      if (trigger === "update" && session) {
        token.name = session.name;
      }

      return token;
    },

    // Called whenever session is checked. Expose role to client.
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "ADMIN";
      }
      return session;
    },
  },

  // ── Custom Pages ──────────────────────────────────────────────────────────
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // ── Events ────────────────────────────────────────────────────────────────
  events: {
    // When a new user signs up via Google OAuth, set their role to CUSTOMER
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "CUSTOMER" },
      });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
