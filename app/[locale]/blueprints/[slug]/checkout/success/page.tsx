import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckoutSuccessView } from "@/components/premium/shared/checkout-success-view";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { isUiLocale } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { isLaunchProduct } from "@/src/lib/payments/launch-catalog";
import { productCommercePaths } from "@/src/lib/payments/products";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isUiLocale(locale) || !isLaunchProduct(slug)) return {};
  return {
    title: siteCopy(locale).success.title,
    robots: { index: false, follow: false },
  };
}

/** Re-reads the same canonical entitlement. This page never writes access. */
export default async function LocaleLaunchCheckoutSuccessPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isUiLocale(locale) || !isLaunchProduct(slug)) notFound();
  const paths = productCommercePaths(slug, locale);
  if (!paths) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.success, locale));
  const entitled = await hasActiveEntitlement(user.id, slug);
  const copy = siteCopy(locale).success;
  return (
    <CheckoutSuccessView
      title={copy.title}
      body={copy.body}
      entitled={entitled}
      confirmed={copy.confirmed}
      pending={copy.pending}
      openLabel={copy.open}
      againLabel={copy.again}
      kitPath={paths.kit}
      successPath={paths.success}
    />
  );
}
