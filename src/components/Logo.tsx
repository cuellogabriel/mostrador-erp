import { Store } from "lucide-react";

interface LogoProps {
  /** Muestra el subtítulo debajo del nombre. */
  withTagline?: boolean;
  tone?: "dark" | "light";
}

export function Logo({ withTagline = false, tone = "dark" }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/30">
        <Store className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`text-lg font-semibold tracking-tight ${tone === "dark" ? "text-slate-900" : "text-white"}`}>
          Mostrador
        </span>
        {withTagline && (
          <span className={`text-xs ${tone === "dark" ? "text-slate-500" : "text-slate-300"}`}>
            Facturación y stock para pymes
          </span>
        )}
      </span>
    </div>
  );
}
