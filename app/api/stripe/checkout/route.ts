import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { parseUiLocale } from "@/src/lib/payments/preview-market";
import { createHostedCheckoutUrl } from "@/src/lib/payments/start-checkout";
import { COLLECTIONS_DEMO_PATH } from "@/src/lib/payments/products";
import { collectionsPaths } from "@/src/lib/i18n/locale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return url.origin;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

async function readCheckoutBody(request: Request): Promise<{
  productSlug: string;
  clientPriceId?: string;
  uiLocale: "ja" | "en" | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return { productSlug: "", uiLocale: null };
    const record = body as Record<string, unknown>;
    return {
      productSlug: typeof record.productSlug === "string" ? record.productSlug : "",
      clientPriceId: typeof record.priceId === "string" ? record.priceId : undefined,
      uiLocale: parseUiLocale(record.uiLocale),
    };
  }
  const form = await request.formData().catch(() => null);
  if (!form) return { productSlug: "", uiLocale: null };
  const productSlug = form.get("productSlug");
  const priceId = form.get("priceId");
  return {
    productSlug: typeof productSlug === "string" ? productSlug : "",
    clientPriceId: typeof priceId === "string" ? priceId : undefined,
    uiLocale: parseUiLocale(form.get("uiLocale")),
  };
}

export async function POST(request: Request) {
  const body = await readCheckoutBody(request);
  const paths = collectionsPaths(body.uiLocale);
  const user = await getCurrentUser();
  if (!user) {
    const signIn = body.uiLocale ? authPath(paths.demo, body.uiLocale) : authPath(COLLECTIONS_DEMO_PATH);
    return NextResponse.redirect(new URL(signIn, request.url), 303);
  }

  try {
    const url = await createHostedCheckoutUrl({
      userId: user.id,
      email: user.email,
      productSlug: body.productSlug,
      origin: requestOrigin(request),
      clientPriceId: body.clientPriceId,
      uiLocale: body.uiLocale,
    });
    return NextResponse.redirect(url, 303);
  } catch {
    const back = new URL(`${paths.demo}?checkout=unavailable`, request.url);
    return NextResponse.redirect(back, 303);
  }
}
