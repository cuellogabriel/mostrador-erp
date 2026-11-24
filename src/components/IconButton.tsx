import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: LucideIcon;
  /** Nombre accesible del botón (también se muestra como tooltip). */
  label: string;
  tone?: "neutral" | "danger";
}

export function IconButton({ icon: Icon, label, tone = "neutral", className = "", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-9 shrink-0 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger"
          ? "text-slate-500 hover:bg-rose-50 hover:text-rose-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      } ${className}`}
      {...props}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
