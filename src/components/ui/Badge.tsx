// components/ui/Badge.tsx

import { cn } from "@/lib/utils/format";

type BadgeVariant = "discount" | "featured" | "success" | "warning" | "error" | "neutral" | "cod";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  discount: "bg-souk-700 text-white",
  featured:  "bg-amber-100 text-amber-800 border border-amber-200",
  success:   "bg-emerald-100 text-emerald-800 border border-emerald-200",
  warning:   "bg-amber-100 text-amber-700 border border-amber-200",
  error:     "bg-red-100 text-red-700 border border-red-200",
  neutral:   "bg-stone-100 text-stone-600 border border-stone-200",
  cod:       "bg-blue-100 text-blue-700 border border-blue-200",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5",
        "text-xs font-semibold rounded-full font-sans",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Order status → badge variant mapping
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    ORDERED:   { variant: "neutral",  label: "Ordered" },
    CONFIRMED: { variant: "cod",      label: "Confirmed" },
    SHIPPED:   { variant: "warning",  label: "Shipped" },
    DELIVERED: { variant: "success",  label: "Delivered" },
    CANCELLED: { variant: "error",    label: "Cancelled" },
  };
  const { variant, label } = map[status] ?? { variant: "neutral", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

// Payment status → badge
export function PaymentBadge({ status, method }: { status: string; method: string }) {
  if (status === "PAID") return <Badge variant="success">✓ Paid</Badge>;
  if (method === "COD")  return <Badge variant="cod">COD</Badge>;
  if (status === "FAILED") return <Badge variant="error">Failed</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}
