"use client";

import { useActionState } from "react";
import { subscribeToNewsletter } from "@/src/lib/newsletter/subscribe";
import type { NewsletterSource, SubscribeResult } from "@/src/lib/newsletter/model";

const initial: SubscribeResult | null = null;

export function NewsletterSignup({
  source,
  idPrefix,
  lead = true,
}: {
  source: NewsletterSource;
  idPrefix: string;
  lead?: boolean;
}) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  const emailId = `${idPrefix}-email`;
  return (
    <form action={action} className="mt-4" noValidate>
      {lead ? (
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>AIや米国テックの最新動向を、短く読みやすい日本語でお届けします。</p>
          <p>現在、ニュースレター配信機能を準備しています。メールアドレスを登録しておくと、配信開始後に受け取れます。</p>
          <p>入力されたメールアドレスは、AI Use Case Atlasのニュースレターおよび更新情報の配信目的でのみ使用します。</p>
        </div>
      ) : null}
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
          {pending ? "登録しています…" : "登録する"}
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
