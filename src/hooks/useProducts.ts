"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/components/AuthProvider";
import { subscribeProducts } from "@/lib/db/products";
import { useLiveData } from "./useLiveData";

export function useProducts() {
  const { uid } = useCurrentUser();
  return useLiveData(useMemo(() => subscribeProducts(uid), [uid]));
}
