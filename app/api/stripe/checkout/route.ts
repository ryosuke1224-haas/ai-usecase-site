import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { createHostedCheckoutUrl } from "@/src/lib/payments/start-checkout";
import { COLLECTIONS_DEMO_PATH } from "@/src/lib/payments/products";

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
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return { productSlug: "" };
    const record = body as Record<string, unknown>;
    return {
      productSlug: typeof record.productSlug === "string" ? record.productSlug : "",
      clientPriceId: typeof record.priceId === "string" ? record.priceId : undefined,
    };
  }
  const form = await request.formData().catch(() => null);
  if (!form) return { productSlug: "" };
  const productSlug = form.get("productSlug");
  const priceId = form.get("priceId");
  return {
    productSlug: typeof productSlug === "string" ? productSlug : "",
    clientPriceId: typeof priceId === "string" ? priceId : undefined,
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL(authPath(COLLECTIONS_DEMO_PATH), request.url), 303);
  }

  const body = await readCheckoutBody(request);
  try {
    const url = await createHostedCheckoutUrl({
      userId: user.id,
      email: user.email,
      productSlug: body.productSlug,
      origin: requestOrigin(request),
      clientPriceId: body.clientPriceId,
    });
    return NextResponse.redirect(url, 303);
  } catch {
    const back = new URL(`${COLLECTIONS_DEMO_PATH}?checkout=unavailable`, request.url);
    return NextResponse.redirect(back, 303);
  }
}
