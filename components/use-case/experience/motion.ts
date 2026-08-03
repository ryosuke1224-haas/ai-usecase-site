"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Reports reduced motion on the server and through hydration. Animated
 * components therefore render their static final state first and only start
 * moving once the real preference is known, which also makes the
 * no-JavaScript output useful on its own.
 */
function getServerSnapshot() {
  return true;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Progressive enhancement for in-page anchors: scrolls smoothly unless reduced
 * motion is requested, then moves focus so keyboard and screen-reader users
 * land on the same section. Callers keep a real href so the plain anchor
 * behaviour still works without JavaScript.
 */
export function scrollToSection(id: string, smooth: boolean) {
  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    block: "start",
  });

  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }
  target.focus({ preventScroll: true });
}
