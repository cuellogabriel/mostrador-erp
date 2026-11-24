"use client";

import { useCallback, useEffect, useState } from "react";
import type { Subscribe } from "@/lib/db/types";

export type LiveData<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: T };

interface Snapshot<T> {
  source: Subscribe<T> | null;
  attempt: number;
  state: LiveData<T>;
}

/**
 * Se suscribe en tiempo real a `subscribe` mientras el componente está visible.
 * `subscribe` debe ser estable (useMemo); al cambiar, vuelve a "loading" hasta tener datos nuevos.
 */
export function useLiveData<T>(subscribe: Subscribe<T>): LiveData<T> & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ source: null, attempt: 0, state: { status: "loading" } });

  useEffect(
    () =>
      subscribe(
        (data) => setSnapshot({ source: subscribe, attempt, state: { status: "ready", data } }),
        (error) => setSnapshot({ source: subscribe, attempt, state: { status: "error", error } }),
      ),
    [subscribe, attempt],
  );

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const current = snapshot.source === subscribe && snapshot.attempt === attempt;
  const state: LiveData<T> = current ? snapshot.state : { status: "loading" };
  return { ...state, retry };
}
