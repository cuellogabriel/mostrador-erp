import { formatDate } from "./dates";
import { calcLine } from "./invoice";
import { INVOICE_STATUS_LABEL } from "./invoiceList";
import { formatEUR } from "./money";
import type { Invoice } from "./types";

/** Resumen de la factura en texto plano para compartir por WhatsApp. */
export function invoiceShareText(invoice: Invoice): string {
  const lines = invoice.lines.map((line) => {
    const { baseCents } = calcLine(line);
    const discount = line.discountPct > 0 ? ` (-${String(line.discountPct).replace(".", ",")} %)` : "";
    return `• ${line.quantity} × ${line.name}${discount}: ${formatEUR(baseCents)}`;
  });
  const vat = invoice.vatBreakdown.map((entry) => `IVA ${entry.rate} %: ${formatEUR(entry.vatCents)}`);
  const status =
    invoice.status === "paid" && invoice.paidAt
      ? `Pagada el ${formatDate(invoice.paidAt)}.`
      : invoice.status === "pending"
        ? "Pendiente de pago."
        : `${INVOICE_STATUS_LABEL[invoice.status]}.`;

  return [
    `Hola, ${invoice.customerName}:`,
    `Te envío el resumen de la factura ${invoice.number} del ${formatDate(invoice.issuedAt)}.`,
    "",
    ...lines,
    "",
    `Base imponible: ${formatEUR(invoice.baseCents)}`,
    ...vat,
    `*Total: ${formatEUR(invoice.totalCents)}*`,
    "",
    status,
    "¡Gracias!",
  ]
    .join("\n")
    .replace(/ /g, " ");
}

/** Enlace de WhatsApp que abre el chat con el texto ya escrito (el usuario elige el contacto). */
export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
