"use server";

import { headers } from "next/headers";
import {
  allowSignupAttempt,
  isNewsletterSource,
  normalizeNewsletterEmail,
  SIGNUP_MESSAGES,
  type SubscribeResult,
} from "./model";
import { saveSubscriber } from "./store";

const attempts = new Map<string, number[]>();

function rememberAttempt(key: string, now: number): boolean {
  const prior = attempts.get(key) ?? [];
  if (!allowSignupAttempt(prior, now)) {
    attempts.set(key, prior.filter((time) => now - time < 10 * 60 * 1000).slice(-5));
    return false;
  }
  const next = [...prior.filter((time) => now - time < 10 * 60 * 1000), now].slice(-5);
  attempts.set(key, next);
  return true;
}

async function clientKey(): Promise<string> {
  const header = (await headers()).get("x-forwarded-for") ?? "";
  const ip = header.split(",")[0]?.trim() || "unknown";
  return ip.slice(0, 80);
}

export async function subscribeToNewsletter(_previous: SubscribeResult | null, formData: FormData): Promise<SubscribeResult> {
  if (String(formData.get("company_website") ?? "").trim()) {
    return { status: "success", message: SIGNUP_MESSAGES.success };
  }
  const sourceValue = String(formData.get("source") ?? "");
  if (!isNewsletterSource(sourceValue)) {
    return { status: "invalid", message: SIGNUP_MESSAGES.invalid };
  }
  const email = normalizeNewsletterEmail(String(formData.get("email") ?? ""));
  if (!email) return { status: "invalid", message: SIGNUP_MESSAGES.invalid };

  const now = Date.now();
  const key = await clientKey();
  if (!rememberAttempt(key, now)) return { status: "limited", message: SIGNUP_MESSAGES.limited };

  const saved = await saveSubscriber(email, sourceValue, new Date(now));
  if (saved === "duplicate") return { status: "duplicate", message: SIGNUP_MESSAGES.duplicate };
  if (saved === "unavailable") return { status: "unavailable", message: SIGNUP_MESSAGES.unavailable };
  return { status: "success", message: SIGNUP_MESSAGES.success };
}
