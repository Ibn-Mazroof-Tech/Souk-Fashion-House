// components/ui/Button.tsx

import { cn } from "@/lib/utils/format";
import { forwardRef } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-souk-700 text-white hover:bg-souk-800 active:bg-souk-900 shadow-sm hover:shadow-souk-sm",
  ghost:
    "bg-transparent text-souk-700 hover:bg-souk-50 border border-souk-700",
  outline:
    "bg-white text-stone-700 border border-stone-200 hover:border-souk-700 hover:text-souk-700",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  whatsapp:
    "bg-[#25D366] text-white hover:bg-[#20ba58] shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-5 text-sm gap-2 rounded-lg",
  lg: "h-12 px-7 text-base gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-sans font-medium",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-souk-700 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-0.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
