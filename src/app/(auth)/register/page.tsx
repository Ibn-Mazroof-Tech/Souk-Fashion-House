"use client";
// app/(auth)/register/page.tsx — Registration Page

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      // Auto sign in after registration
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (!signInRes?.error) {
        toast.success("Account created! Welcome to Souk.");
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-souk-700 focus:border-transparent placeholder:text-stone-400 bg-white";
  const f = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-souk-700 flex items-center justify-center text-white font-display font-bold text-lg">S</div>
            <span className="font-display text-xl font-semibold text-stone-900">Souk Fashion House</span>
          </Link>
          <h1 className="font-display text-3xl font-medium text-stone-900 mb-1">Create Account</h1>
          <p className="text-sm text-stone-500 font-sans">Join Souk for exclusive offers</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-souk-md p-8">
          <Button onClick={() => signIn("google", { callbackUrl: "/" })} variant="outline" size="lg" fullWidth className="rounded-xl mb-5 border-stone-200 text-stone-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </Button>

          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-xs text-stone-400 font-sans">or register with email</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="text" required placeholder="Full name" value={form.name}
                onChange={(e) => f("name", e.target.value)} className={inputCls} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="email" required placeholder="Email address" value={form.email}
                onChange={(e) => f("email", e.target.value)} className={inputCls} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="tel" placeholder="Phone (optional)" value={form.phone} maxLength={10}
                onChange={(e) => f("phone", e.target.value.replace(/\D/g, ""))} className={inputCls} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type={showPass ? "text" : "password"} required placeholder="Password (min 8 chars)" value={form.password}
                onChange={(e) => f("password", e.target.value)} className={`${inputCls} pr-10`} />
              <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-stone-400 font-sans">Must include uppercase, number, and 8+ characters.</p>
            <Button type="submit" loading={loading} size="lg" fullWidth className="rounded-xl">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6 font-sans">
          Already have an account?{" "}
          <Link href="/login" className="text-souk-700 font-semibold hover:text-souk-800">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
