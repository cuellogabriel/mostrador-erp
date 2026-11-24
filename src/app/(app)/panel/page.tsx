import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Panel" };

export default function PanelPage() {
  return (
    <>
      <PageHeader title="Panel" description="Lo importante de tu negocio, de un vistazo." />
      <EmptyState icon={LayoutDashboard} title="Tu panel se está preparando" description="Muy pronto verás aquí lo facturado este mes, lo pendiente de cobro y el stock bajo." />
    </>
  );
}
