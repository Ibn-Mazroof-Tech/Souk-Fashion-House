"use client";
// ─────────────────────────────────────────────────────────────────────────────
// components/store/HeroCarousel.tsx — Auto-rotating hero image carousel
// Images + optional title/subtitle/link are managed from Admin → Homepage
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Slide = {
  id: string;
  image: string;
  title: string | null;
  subtitle: string | null;
  linkUrl: string | null;
};

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slideBody = (slide: Slide) => (
    <>
      <Image
        src={slide.image}
        alt={slide.title ?? "Souk Fashion House"}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {(slide.title || slide.subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 via-black/10 to-transparent">
          {slide.title && <p className="font-display text-xl font-semibold text-white">{slide.title}</p>}
          {slide.subtitle && <p className="text-stone-100 text-sm font-sans">{slide.subtitle}</p>}
        </div>
      )}
    </>
  );

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[4/5] md:aspect-[3/4] shadow-souk-md">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? "auto" : "none" }}
        >
          {slide.linkUrl ? (
            <Link href={slide.linkUrl} className="block relative w-full h-full">
              {slideBody(slide)}
            </Link>
          ) : (
            <div className="relative w-full h-full">{slideBody(slide)}</div>
          )}
        </div>
      ))}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
