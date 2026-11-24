import type { Metadata } from "next";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Productos" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader title="Productos" description="Tu catálogo con precios, IVA y stock." />
      <EmptyState icon={Package} title="Aún no hay productos" description="Muy pronto podrás gestionar tu catálogo y controlar el stock desde aquí." />
    </>
  );
}
