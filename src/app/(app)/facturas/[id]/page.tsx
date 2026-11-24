import type { Metadata } from "next";
import { Suspense } from "react";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { InvoiceDetailSkeleton } from "@/components/invoices/InvoiceDetailSkeleton";

export const metadata: Metadata = { title: "Factura" };

// El número solo se conoce en el navegador; Suspense da el esqueleto mientras tanto.
export default function InvoicePage() {
  return (
    <Suspense fallback={<InvoiceDetailSkeleton />}>
      <InvoiceDetail />
    </Suspense>
  );
}
