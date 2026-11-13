import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutSuccessView } from "@/components/premium/shared/checkout-success-view";
import { requireUser } from "@/src/lib/auth";
import { siteCopy } from "@/src/lib/i18n/copy";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { isLaunchProduct } from "@/src/lib/payments/launch-catalog";
import { productCommercePaths } from "@/src/lib/payments/products";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isLaunchProduct(slug)) return {};
  return {
    title: siteCopy("en").success.title,
    description: siteCopy("en").success.body,
    robots: { index: false, follow: false },
    alternates: { canonical: `/blueprints/${slug}/checkout/success` },
  };
}

/** Re-reads the entitlement. This page never writes access. */
export default async function LaunchCheckoutSuccessPage({ params }: PageProps) {
  const { slug } = await params;
  const paths = productCommercePaths(slug, null);
  if (!isLaunchProduct(slug) || !paths) notFound();
  const user = await requireUser(paths.success);
  const entitled = await hasActiveEntitlement(user.id, slug);
  const copy = siteCopy("en").success;
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
