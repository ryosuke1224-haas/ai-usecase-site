"use client";

import { useActionState } from "react";
import { subscribeToNewsletter } from "@/src/lib/newsletter/subscribe";
import type { NewsletterSource, SubscribeResult } from "@/src/lib/newsletter/model";

const initial: SubscribeResult | null = null;

export function NewsletterSignup({
  source,
  idPrefix,
}: {
  source: NewsletterSource;
  idPrefix: string;
}) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  const emailId = `${idPrefix}-email`;
  return (
    <form action={action} className="mt-4" noValidate>
      <p className="text-sm leading-relaxed text-muted">
        入力されたメールアドレスは、AI Use Case Atlas の更新情報とニュースレターをお届けするために使います。送信はまだ始まりません。
      </p>
      <input type="hidden" name="source" value={source} />
      <label className="sr-only" aria-hidden="true">
        会社サイト
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={emailId}>
          メールアドレス
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "送信しています…" : "登録する"}
        </button>
      </div>
      {state ? (
        <p role="status" className="mt-3 text-sm text-foreground">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
