"use client";

import {
  CornerDownLeft,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Package,
  PackagePlus,
  Search,
  Settings,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { useInvoices } from "@/hooks/useInvoices";
import { useProducts } from "@/hooks/useProducts";
import { formatEUR } from "@/lib/money";
import { matchesQuery } from "@/lib/search";
import { requestIntent, type Intent } from "./intents";
import { useModal } from "./useModal";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: LucideIcon;
  href: string;
  intent?: Intent;
}

interface PaletteGroup {
  title: string;
  items: PaletteItem[];
}

const MAX_PER_GROUP = 5;

const ACTIONS: PaletteItem[] = [
  { id: "a-invoice", label: "Nueva factura", keywords: "crear emitir", icon: FilePlus2, href: "/facturas/nueva" },
  { id: "a-customer", label: "Nuevo cliente", keywords: "crear alta", icon: UserPlus, href: "/clientes", intent: "new-customer" },
  { id: "a-product", label: "Nuevo producto", keywords: "crear alta articulo", icon: PackagePlus, href: "/productos", intent: "new-product" },
];

const PAGES: PaletteItem[] = [
  { id: "p-panel", label: "Ir al panel", keywords: "inicio resumen", icon: LayoutDashboard, href: "/panel" },
  { id: "p-invoices", label: "Ir a facturas", icon: FileText, href: "/facturas" },
  { id: "p-customers", label: "Ir a clientes", icon: Users, href: "/clientes" },
  { id: "p-products", label: "Ir a productos", keywords: "stock catalogo", icon: Package, href: "/productos" },
  { id: "p-settings", label: "Ir a ajustes", keywords: "empresa emisor datos fiscales", icon: Settings, href: "/ajustes" },
];

/** Paleta de comandos (Ctrl/⌘ + K): busca clientes, productos, facturas y acciones. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  useModal(dialogRef, onClose);

  const customers = useCustomers();
  const products = useProducts();
  const invoices = useInvoices();

  const groups = useMemo<PaletteGroup[]>(() => {
    const match = (item: PaletteItem) => matchesQuery([item.label, item.hint, item.keywords], query);
    const result: PaletteGroup[] = [{ title: "Acciones", items: ACTIONS.filter(match) }];
    if (query.trim()) {
      if (customers.status === "ready") {
        result.push({
          title: "Clientes",
          items: customers.data
            .map((c) => ({ id: `c-${c.id}`, label: c.name, hint: c.taxId ?? c.email, keywords: c.email, icon: Users, href: `/clientes/${c.id}` }))
            .filter(match)
            .slice(0, MAX_PER_GROUP),
        });
      }
      if (products.status === "ready") {
        result.push({
          title: "Productos",
          items: products.data
            .map((p) => ({ id: `p-${p.id}`, label: p.name, hint: `${formatEUR(p.priceCents)} · ${p.stock} en stock`, keywords: p.sku, icon: Package, href: "/productos" }))
            .filter(match)
            .slice(0, MAX_PER_GROUP),
        });
      }
      if (invoices.status === "ready") {
        result.push({
          title: "Facturas",
          items: invoices.data
            .map((i) => ({ id: `i-${i.id}`, label: `${i.number} · ${i.customerName}`, hint: formatEUR(i.totalCents), keywords: i.customerTaxId, icon: FileText, href: `/facturas/${i.id}` }))
            .filter(match)
            .slice(0, MAX_PER_GROUP),
        });
      }
    }
    result.push({ title: "Ir a", items: PAGES.filter(match) });
    return result.filter((group) => group.items.length > 0);
  }, [query, customers, products, invoices]);

  const items = groups.flatMap((group) => group.items);
  const activeIndex = items.length === 0 ? -1 : Math.min(active, items.length - 1);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;
  const loading = query.trim() !== "" && [customers, products, invoices].some((s) => s.status === "loading");

  useEffect(() => {
    if (!activeItem) return;
    listRef.current?.querySelector(`[data-id="${activeItem.id}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeItem]);

  function run(item: PaletteItem) {
    if (item.intent) requestIntent(item.intent);
    onClose();
    router.push(item.href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(items.length - 1);
    } else if (event.key === "Enter" && activeItem) {
      event.preventDefault();
      run(activeItem);
    }
  }

  const optionId = (item: PaletteItem) => `${listId}-${item.id}`;

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center p-4 pt-[12vh] print:hidden">
      <div aria-hidden="true" className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/25 ring-1 ring-slate-200 motion-safe:animate-pop-in"
      >
        <h2 id={titleId} className="sr-only">
          Buscar en Mostrador
        </h2>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="size-5 shrink-0 text-slate-500" aria-hidden="true" />
          <input
            data-autofocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeItem ? optionId(activeItem) : undefined}
            aria-label="Buscar clientes, productos, facturas o acciones"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Busca clientes, productos, facturas o acciones…"
            autoComplete="off"
            spellCheck={false}
            className="h-14 w-full bg-transparent text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 sm:block">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="overflow-y-auto">
        <div id={listId} role="listbox" aria-label="Resultados" className={items.length === 0 ? "hidden" : "p-2"}>
          {groups.map((group, groupIndex) => {
            // Ids sin espacios: "Ir a" rompería aria-labelledby.
            const headingId = `${listId}-group-${groupIndex}`;
            return (
              <div key={group.title} role="group" aria-labelledby={headingId} className="pb-2">
                <div id={headingId} className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const selected = item.id === activeItem?.id;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      id={optionId(item)}
                      data-id={item.id}
                      role="option"
                      aria-selected={selected}
                      onMouseMove={() => setActive(items.indexOf(item))}
                      onClick={() => run(item)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                        selected ? "bg-emerald-50 text-emerald-900" : "text-slate-700"
                      }`}
                    >
                      <Icon className={`size-4 shrink-0 ${selected ? "text-emerald-700" : "text-slate-500"}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                      {item.hint && <span className="shrink-0 truncate text-xs text-slate-500">{item.hint}</span>}
                      {selected && <CornerDownLeft className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        {/* Fuera del listbox: un listbox solo puede contener opciones y grupos. */}
        <p role="status" className={items.length === 0 ? "px-3 py-8 text-center text-sm text-slate-600" : "sr-only"}>
          {items.length === 0 ? (loading ? "Buscando…" : `No hay resultados para «${query.trim()}».`) : ""}
        </p>
        </div>

        <div className="hidden items-center gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500 sm:flex">
          <span>
            <kbd className="font-sans font-medium">↑</kbd> <kbd className="font-sans font-medium">↓</kbd> para moverte
          </span>
          <span>
            <kbd className="font-sans font-medium">Enter</kbd> para abrir
          </span>
          <span>
            <kbd className="font-sans font-medium">Esc</kbd> para cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
