import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isJapanLaunchReviewVisible,
  japanLaunchDecision,
  japanLaunchReviewItems,
} from "@/src/lib/japan-launch/review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Japan launch review",
  robots: { index: false, follow: false },
};

export default function JapanLaunchReviewPage() {
  if (!isJapanLaunchReviewVisible()) notFound();
  const decision = japanLaunchDecision();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs font-semibold tracking-wider text-accent">確認用</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">日本公開の確認</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        公開前の確認用です。このページから Production への公開や Live 決済の作成はできません。
      </p>
      <p className="mt-4 rounded-xl border border-border/60 bg-surface px-4 py-3 font-mono text-sm">
        {decision.code}
      </p>
      <ul className="mt-8 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
        {japanLaunchReviewItems.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.note}</p>
              {item.href ? (
                <Link href={item.href} className="mt-2 inline-flex text-sm font-medium text-accent hover:underline">
                  {item.href}
                </Link>
              ) : null}
            </div>
            <p className="font-mono text-xs font-semibold tracking-wide text-foreground">{item.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
