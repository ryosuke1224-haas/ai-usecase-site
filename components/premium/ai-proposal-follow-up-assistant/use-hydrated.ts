"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** False in the server HTML and during hydration, so controls stay disabled until their handlers exist. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
