"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/components/AuthProvider";
import { subscribeCustomerInvoices, subscribeInvoice, subscribeInvoices } from "@/lib/db/invoices";
import { useLiveData } from "./useLiveData";

export function useInvoices() {
  const { uid } = useCurrentUser();
  return useLiveData(useMemo(() => subscribeInvoices(uid), [uid]));
}

export function useInvoice(id: string) {
  const { uid } = useCurrentUser();
  return useLiveData(useMemo(() => subscribeInvoice(uid, id), [uid, id]));
}

export function useCustomerInvoices(customerId: string) {
  const { uid } = useCurrentUser();
  return useLiveData(useMemo(() => subscribeCustomerInvoices(uid, customerId), [uid, customerId]));
}
