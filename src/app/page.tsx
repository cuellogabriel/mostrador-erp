import {
  Boxes,
  ChartColumn,
  ClipboardCheck,
  Code2,
  Command,
  FlaskConical,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LandingCta } from "@/components/landing/LandingCta";
import { ProductMockup } from "@/components/landing/ProductMockup";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: { absolute: "Mostrador · Facturación y stock para pymes" },
};

const REPO_URL = "https://github.com/cuellogabriel/mostrador-erp";

const FEATURES = [
  {
    icon: ReceiptText,
    title: "Facturas con IVA en segundos",
    text: "Numeración correlativa F-AAAA-NNNN sin huecos, desglose por tipo (21, 10, 4 y 0 %), descuentos por línea, PDF y envío por WhatsApp.",
  },
  {
    icon: Boxes,
    title: "Stock que cuadra solo",
    text: "Cada factura descuenta existencias en la misma operación y anularla las repone. Avisos de stock bajo y agotado.",
  },
  {
    icon: Users,
    title: "Clientes en orden",
    text: "Ficha con NIF/CIF/NIE validado, contacto, notas y todas sus facturas con el total facturado.",
  },
  {
    icon: ChartColumn,
    title: "Tu negocio de un vistazo",
    text: "Panel con lo facturado este mes, lo pendiente de cobro, la evolución de 6 meses y lo que hay que reponer.",
  },
] as const;

const AGENTS = [
  {
    icon: Command,
    name: "Orquestador",
    text: "Mantiene el plan, reparte las tareas y solo da una por terminada cuando testing la aprueba.",
  },
  {
    icon: Code2,
    name: "develop",
    text: "Programa cada tarea siguiendo su guía: TypeScript estricto, lógica pura con tests y transacciones.",
  },
  {
    icon: FlaskConical,
    name: "testing",
    text: "Revisa contra 14 directrices (seguridad, dinero, accesibilidad, móvil…) y devuelve los fallos hasta aprobar.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav aria-label="Portada" className="flex items-center gap-1 text-sm font-medium">
            <a href="#funciones" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">
              Funciones
            </a>
            <a href="#como-se-hizo" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">
              Cómo se ha construido
            </a>
            <Link href="/login" className="rounded-lg px-3 py-2 text-emerald-700 hover:text-emerald-800">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_-10%,rgb(16_185_129/0.12),transparent),radial-gradient(40rem_20rem_at_0%_10%,rgb(20_184_166/0.08),transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
            <div className="text-center sm:text-left">
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Gratis para probar, sin instalar nada
              </p>
              <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Facturación y stock para pymes, sin complicaciones
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-slate-600 sm:mx-0">
                Clientes, productos con stock y facturas con IVA en un solo sitio. Emites, cobras y repones sin hojas
                de cálculo, desde el ordenador o el móvil.
              </p>
              <div className="mt-8">
                <LandingCta />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Demo: <span className="font-medium text-slate-700">demo@mostrador.app</span> · un clic en «Entrar con
                la cuenta demo».
              </p>
            </div>
            <ProductMockup />
          </div>
        </section>

        <section id="funciones" aria-labelledby="funciones-title" className="scroll-mt-16 border-t border-slate-100 bg-slate-50/70">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="funciones-title" className="text-3xl font-semibold tracking-tight text-slate-900">
              Lo que necesita el día a día de un negocio
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Sin módulos que no vas a usar: lo justo para facturar bien y saber qué tienes en el almacén.
            </p>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="como-se-hizo" aria-labelledby="como-title" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
              <div>
                <h2 id="como-title" className="text-3xl font-semibold tracking-tight text-slate-900">
                  Cómo se ha construido
                </h2>
                <p className="mt-3 text-slate-600">
                  Mostrador lo ha programado un equipo de tres agentes de Claude Code que trabajan en bucle: el
                  orquestador planifica, develop programa y testing revisa hasta que todo pasa. Cada rechazo y cada
                  aprobación quedan escritos en el repositorio.
                </p>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <ClipboardCheck className="size-4" aria-hidden="true" />
                  Ver el código, el plan y las revisiones en GitHub
                  <span className="sr-only">(se abre en una ventana nueva)</span>
                </a>
              </div>
              <ol className="grid gap-4 sm:grid-cols-3">
                {AGENTS.map(({ icon: Icon, name, text }, i) => (
                  <li key={name} className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <span className="text-xs font-medium text-slate-500">Paso {i + 1}</span>
                    <span className="mt-3 grid size-10 place-items-center rounded-xl bg-slate-900 text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 font-semibold text-slate-900">{name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 text-center text-white sm:px-12">
            <h2 id="cta-title" className="text-3xl font-semibold tracking-tight text-balance">
              Pruébalo con datos de ejemplo en un minuto
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Entra con la cuenta demo o crea la tuya y carga clientes, productos y facturas de ejemplo desde el panel.
            </p>
            <div className="mt-8">
              <LandingCta align="center" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <p>
            Hecho por <span className="font-medium text-slate-700">Gabriel Cuello</span>
          </p>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 hover:underline">
            Código en GitHub<span className="sr-only"> (se abre en una ventana nueva)</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
