// components/ui/Input.tsx

import { cn } from "@/lib/utils/format";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-stone-700"
          >
            {label}
            {props.required && <span className="text-souk-700 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 px-3 rounded-lg border bg-white font-sans text-sm text-stone-900",
            "placeholder:text-stone-400 transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-souk-700/30 focus:border-souk-700",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-stone-200 hover:border-stone-300",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
        {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ── Select ─────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-stone-700">
            {label}
            {props.required && <span className="text-souk-700 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full h-10 px-3 rounded-lg border bg-white font-sans text-sm text-stone-900",
            "focus:outline-none focus:ring-2 focus:ring-souk-700/30 focus:border-souk-700",
            "transition-colors duration-150 cursor-pointer appearance-none",
            error ? "border-red-400" : "border-stone-200 hover:border-stone-300",
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">⚠ {error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
