import { FileText, LayoutDashboard, Package, Settings, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: "/panel" | "/facturas" | "/clientes" | "/productos" | "/ajustes";
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/facturas", label: "Facturas", icon: FileText },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];
