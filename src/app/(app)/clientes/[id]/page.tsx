import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerDetail } from "@/components/customers/CustomerDetail";
import { CustomerDetailSkeleton } from "@/components/customers/CustomerDetailSkeleton";

export const metadata: Metadata = { title: "Ficha de cliente" };

// El id solo se conoce en el navegador; Suspense da el esqueleto mientras tanto.
export default function CustomerPage() {
  return (
    <Suspense fallback={<CustomerDetailSkeleton />}>
      <CustomerDetail />
    </Suspense>
  );
}
