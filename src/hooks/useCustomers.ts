"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/components/AuthProvider";
import { subscribeCustomer, subscribeCustomers } from "@/lib/db/customers";
import { useLiveData } from "./useLiveData";

export function useCustomers() {
  const { uid } = useCurrentUser();
  return useLiveData(useMemo(() => subscribeCustomers(uid), [uid]));
}

export function useCustomer(id: string) {
  const { uid } = useCurrentUser();
  return useLiveData(useMemo(() => subscribeCustomer(uid, id), [uid, id]));
}
