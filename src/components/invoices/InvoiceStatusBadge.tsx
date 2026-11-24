import { INVOICE_STATUS_LABEL } from "@/lib/invoiceList";
import type { InvoiceStatus } from "@/lib/types";
import { Badge, type BadgeTone } from "../Badge";

const TONE: Record<InvoiceStatus, BadgeTone> = { pending: "warning", paid: "success", void: "neutral" };

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={TONE[status]}>{INVOICE_STATUS_LABEL[status]}</Badge>;
}
