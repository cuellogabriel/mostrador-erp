"use client";

import { ChartColumn, Package, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { FullScreenLoader } from "./FullScreenLoader";
import { Logo } from "./Logo";

const FEATURES = [
  {
    icon: ReceiptText,
    title: "Facturas con IVA en segundos",
    text: "Numeración correlativa, desglose por tipo y listas para imprimir o enviar.",
  },
  {
    icon: Package,
    title: "Stock siempre al día",
    text: "Cada factura descuenta existencias y te avisa cuando algo se acaba.",
  },
  {
    icon: ChartColumn,
    title: "Tu negocio de un vistazo",
    text: "Lo facturado, lo pendiente de cobro y la evolución de los últimos meses.",
  },
] as const;

/** Marco de las pantallas públicas de acceso. Si ya hay sesión, manda al panel. */
export function AuthShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/panel");
  }, [loading, user, router]);

  if (loading || user) return <FullScreenLoader label="Cargando…" />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 px-12 py-12 text-white lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full bg-emerald-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-0 size-[26rem] rounded-full bg-teal-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
        />

        <div className="relative">
          <Logo withTagline tone="light" />
        </div>

        <div className="relative mt-auto max-w-md">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight text-balance">
            Factura, controla tu stock y cobra a tiempo.
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Todo lo que necesita una pequeña empresa para llevar el día a día, sin hojas de cálculo.
          </p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300 ring-1 ring-white/10">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="mt-0.5 block text-sm text-slate-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-16 text-xs text-slate-500">© Mostrador · Hecho para pymes</p>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Logo withTagline />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
