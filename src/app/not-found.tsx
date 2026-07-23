// app/not-found.tsx — Global 404 Page

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Decorative number */}
        <div className="font-display text-[120px] md:text-[160px] font-bold text-souk-700/10 leading-none select-none mb-4">
          404
        </div>
        <h1 className="font-display text-3xl font-medium text-stone-900 mb-3 -mt-8">
          Page not found
        </h1>
        <p className="text-stone-500 font-sans text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="btn-souk inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors font-sans"
          >
            Browse Collections
          </Link>
        </div>
      </div>
    </div>
  );
}
