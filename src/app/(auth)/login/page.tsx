"use client";
// ─────────────────────────────────────────────────────────────────────────────
// app/(auth)/login/page.tsx — Login Page
// Replaces: Firebase auth placeholder from auth.js
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  const inputCls = "w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 focus:border-transparent placeholder:text-stone-400 bg-white";

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-souk-700 flex items-center justify-center text-white font-display font-bold text-lg">S</div>
            <span className="font-display text-xl font-semibold text-stone-900">Souk Fashion House</span>
          </Link>
          <h1 className="font-display text-3xl font-medium text-stone-900 mb-1">Welcome back</h1>
          <p className="text-sm text-stone-500 font-sans">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-md p-8">

          {/* Google sign in */}
          <Button
            onClick={handleGoogle}
            loading={googleLoading}
            variant="outline"
            size="lg"
            fullWidth
            className="rounded-xl mb-5 border-stone-200 text-stone-700"
          >
            {!googleLoading && (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-xs text-stone-400 font-sans">or sign in with email</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="email" required placeholder="Email address" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type={showPass ? "text" : "password"} required placeholder="Password" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" loading={loading} size="lg" fullWidth className="rounded-xl mt-1">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6 font-sans">
          Don't have an account?{" "}
          <Link href="/register" className="text-souk-700 font-semibold hover:text-souk-800">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
