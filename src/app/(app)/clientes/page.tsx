import type { Metadata } from "next";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Clientes" };

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Clientes" description="Las personas y empresas a las que facturas." />
      <EmptyState icon={Users} title="Aún no hay clientes" description="Muy pronto podrás dar de alta clientes con su NIF, email y teléfono." />
    </>
  );
}
