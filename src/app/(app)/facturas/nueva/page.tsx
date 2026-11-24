import type { Metadata } from "next";
import { NewInvoiceView } from "@/components/invoices/NewInvoiceView";

export const metadata: Metadata = { title: "Nueva factura" };

export default function NewInvoicePage() {
  return <NewInvoiceView />;
}
