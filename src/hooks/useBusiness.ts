"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/components/AuthProvider";
import { subscribeBusiness } from "@/lib/db/business";
import { useLiveData } from "./useLiveData";

export function useBusiness() {
  const { uid } = useCurrentUser();
  return useLiveData(useMemo(() => subscribeBusiness(uid), [uid]));
}
