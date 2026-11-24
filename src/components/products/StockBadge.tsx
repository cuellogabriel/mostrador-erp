import { stockStatus } from "@/lib/stock";
import { Badge } from "../Badge";

/** "Agotado" o "Stock bajo"; nada si el stock va bien. */
export function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  const status = stockStatus(stock, minStock);
  if (status === "out") return <Badge tone="danger">Agotado</Badge>;
  if (status === "low") return <Badge tone="warning">Stock bajo</Badge>;
  return null;
}
