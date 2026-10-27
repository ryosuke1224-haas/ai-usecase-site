import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/premium/ai-collections-assistant/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { collectionsPaths, isUiLocale } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { COLLECTIONS_PRODUCT_SLUG } from "@/src/lib/payments/products";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: siteCopy(locale).success.title,
    robots: { index: false, follow: false },
  };
}

export default async function LocaleCheckoutSuccessPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = collectionsPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.success, locale));
  const entitled = await hasActiveEntitlement(user.id, COLLECTIONS_PRODUCT_SLUG);
  const copy = siteCopy(locale).success;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.body}</p>
      {entitled ? (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-foreground">{copy.confirmed}</p>
          <Link href={paths.kit} className={`mt-4 ${PRIMARY_BUTTON}`}>
            {copy.open}
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-foreground">{copy.pending}</p>
          <Link href={paths.success} className={`mt-4 ${SECONDARY_BUTTON}`}>
            {copy.again}
          </Link>
        </div>
      )}
    </div>
  );
}
