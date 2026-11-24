import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Facturas" };

export default function InvoicesPage() {
  return (
    <>
      <PageHeader title="Facturas" description="Emite, cobra y consulta tus facturas." />
      <EmptyState icon={FileText} title="Aún no hay facturas" description="Muy pronto podrás crear facturas con IVA y numeración automática desde aquí." />
    </>
  );
}
