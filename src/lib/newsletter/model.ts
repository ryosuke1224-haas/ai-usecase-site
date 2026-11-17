export const NEWSLETTER_SOURCES = ["ja-home", "ja-blog", "ja-article", "ja-newsletter"] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

export type SubscriberStatus = "ACTIVE" | "UNSUBSCRIBED";

export type SubscribeResult =
  | { status: "success" | "duplicate" | "invalid" | "limited" | "unavailable"; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

export function normalizeNewsletterEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return null;
  return email;
}

export function isNewsletterSource(value: string): value is NewsletterSource {
  return NEWSLETTER_SOURCES.some((source) => source === value);
}

export function subscriberAction(existing: SubscriberStatus | null): "insert" | "already" | "resubscribe" {
  if (existing === "ACTIVE") return "already";
  if (existing === "UNSUBSCRIBED") return "resubscribe";
  return "insert";
}

export function recentActiveSubscribers(
  rows: { status: string; subscribedAt: string | null }[],
  now: Date,
): number {
  const start = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return rows.filter((row) => {
    if (row.status !== "ACTIVE" || !row.subscribedAt) return false;
    const time = Date.parse(row.subscribedAt);
    return !Number.isNaN(time) && time >= start && time <= now.getTime();
  }).length;
}

export function summarizeSubscribers(rows: { status: string; subscribedAt: string | null }[], now: Date): {
  active: number;
  recent: number;
  unsubscribed: number;
} {
  return {
    active: rows.filter((row) => row.status === "ACTIVE").length,
    recent: recentActiveSubscribers(rows, now),
    unsubscribed: rows.filter((row) => row.status === "UNSUBSCRIBED").length,
  };
}

export function allowSignupAttempt(timestamps: number[], now: number): boolean {
  const recent = timestamps.filter((time) => now - time < WINDOW_MS && time <= now);
  return recent.length < LIMIT;
}

export const SIGNUP_MESSAGES = {
  success: "登録しました。配信が始まってからお届けします。",
  duplicate: "このメールアドレスは登録済みです。",
  invalid: "メールアドレスの形式を確認してください。",
  limited: "短時間に何度も送信されています。しばらくしてからもう一度お試しください。",
  unavailable: "登録を保存できませんでした。しばらくしてからもう一度お試しください。",
} as const;
