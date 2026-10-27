import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthForm, type AuthFormCopy } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/src/lib/auth";
import { DAILY_INBOX_STARTER_KIT_PATH, sanitizeNextPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { isUiLocale, localizedHref } from "@/src/lib/i18n/locale";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return { title: siteCopy(locale).auth.heading, robots: { index: false, follow: false } };
}

export default async function LocaleAuthPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const query = await searchParams;
  const fallback = localizedHref(locale, "/my-blueprints");
  const nextPath = sanitizeNextPath(query.next, fallback);
  const copy = siteCopy(locale).auth;
  const starter =
    nextPath === DAILY_INBOX_STARTER_KIT_PATH ||
    nextPath.startsWith(`${DAILY_INBOX_STARTER_KIT_PATH}?`) ||
    nextPath.startsWith(`${DAILY_INBOX_STARTER_KIT_PATH}/`);
  const user = await getCurrentUser();
  if (user) redirect(nextPath);

  const formCopy: AuthFormCopy = {
    email: copy.email,
    placeholder: copy.placeholder,
    continue: copy.continue,
    sending: copy.sending,
    sentTitle: copy.sentTitle,
    sentLead: copy.sentLead,
    sentTail: copy.sentTail,
    differentEmail: copy.differentEmail,
    emptyEmail: copy.emptyEmail,
    sendFailed: copy.sendFailed,
    freeAccount: copy.freeAccount,
    sameEmail: copy.sameEmail,
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12 sm:py-16">
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
          {starter ? copy.starterEyebrow : copy.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {starter ? copy.starterHeading : copy.heading}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {starter ? copy.starterDescription : copy.description}
        </p>
        {query.error ? (
          <p role="alert" className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            {copy.expired}
          </p>
        ) : null}
        <div className="mt-6">
          <AuthForm nextPath={nextPath} copy={formCopy} />
        </div>
      </div>
    </div>
  );
}
