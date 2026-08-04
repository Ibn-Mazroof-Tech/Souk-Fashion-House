import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Souk Brand Colors ─────────────────────────────────────────────────
      colors: {
        souk: {
          50:  "#fdf5f5",
          100: "#fae8e8",
          200: "#f5d0d0",
          300: "#edadad",
          400: "#e07d7d",
          500: "#ce5151",
          600: "#b83b3b",
          // Original brand accent: #8b3d3d
          700: "#8b3d3d",
          800: "#6e2f2f",
          900: "#4a1f1f",
          950: "#2e1212",
        },
        cream: {
          50:  "#faf8f5",  // Original --bg
          100: "#f4f0ea",
          200: "#e8dfd4",
        },
      },
      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        // Display font: Cormorant Garamond (elegant, editorial)
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        // Body font: DM Sans (clean, readable)
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        // Monospace for order IDs etc.
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      // ── Spacing ───────────────────────────────────────────────────────────
      maxWidth: {
        "8xl": "1400px",
      },
      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite linear",
      },
      // ── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        "souk-sm": "0 2px 8px rgba(139, 61, 61, 0.08)",
        "souk-md": "0 4px 20px rgba(139, 61, 61, 0.12)",
        "souk-lg": "0 8px 40px rgba(139, 61, 61, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
