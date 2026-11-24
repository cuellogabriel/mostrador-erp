"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { isActivePath } from "@/lib/navigation";
import { useAuth } from "./AuthProvider";
import { FullScreenLoader } from "./FullScreenLoader";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./navItems";

/**
 * Zona privada: no pinta nada de `children` hasta que Firebase confirma la sesión.
 * Sin sesión, redirige a /login.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <FullScreenLoader label="Comprobando tu sesión…" />;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  const signOutButton = (compact: boolean) => (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      aria-label={compact ? "Salir" : undefined}
      className={`inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 ${
        compact ? "size-10 justify-center" : "h-9 px-2.5"
      }`}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {!compact && "Salir"}
    </button>
  );

  return (
    <div className="min-h-dvh">
      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="px-5 pt-6 pb-8">
          <Logo withTagline />
        </div>
        <nav aria-label="Principal" className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                      active
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`size-[18px] ${active ? "text-emerald-600" : "text-slate-400"}`} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="m-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Sesión iniciada como</p>
          <p className="mt-0.5 truncate text-sm font-medium text-slate-800" title={user.email ?? undefined}>
            {user.email}
          </p>
          <div className="mt-2 -ml-2.5">{signOutButton(false)}</div>
        </div>
      </aside>

      {/* Barra superior (móvil) */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        {signOutButton(true)}
      </header>

      <main className="pb-24 lg:pb-0 lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>

      {/* Barra inferior (móvil) */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                    active ? "text-emerald-700" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
