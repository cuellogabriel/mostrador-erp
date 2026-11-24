import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
}

const VARIANTS = {
  primary:
    "bg-emerald-700 text-white shadow-sm shadow-emerald-800/20 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-700/70",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
} as const;

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
