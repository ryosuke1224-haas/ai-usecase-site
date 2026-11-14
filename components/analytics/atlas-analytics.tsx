"use client";

import { Analytics } from "@vercel/analytics/next";
import { analyticsBeforeSend } from "@/src/lib/analytics/filter";

/** Production page views. Auto mode sends only outside local development. /admin is dropped. */
export function AtlasAnalytics() {
  return <Analytics beforeSend={analyticsBeforeSend} />;
}
