"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../AuthProvider";
import { buttonClassName } from "../Button";

/** Botones de la portada: con sesión, "Ir al panel"; sin ella, demo y registro. */
export function LandingCta({ align = "start" }: { align?: "start" | "center" }) {
  const { user, loading } = useAuth();
  const justify = align === "center" ? "justify-center" : "justify-center sm:justify-start";

  if (!loading && user) {
    return (
      <div className={`flex flex-wrap gap-3 ${justify}`}>
        <Link href="/panel" className={buttonClassName("primary", "h-12 px-5")}>
          Ir al panel
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-3 ${justify}`}>
      <Link href="/login" className={buttonClassName("primary", "h-12 px-5")}>
        Probar la demo
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <Link href="/registro" className={buttonClassName("secondary", "h-12 px-5")}>
        Crear cuenta
      </Link>
    </div>
  );
}
