import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { grantCheckoutSession, type CheckoutCompletion } from "@/src/lib/payments/entitlement";
import { upsertEntitlement } from "@/src/lib/payments/entitlement-store";
import { getStripe } from "@/src/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sessionFromEvent(event: Stripe.Event): CheckoutCompletion | null {
  if (event.type !== "checkout.session.completed") return null;
  const session = event.data.object;
  return {
    id: session.id,
    payment_status: session.payment_status,
    status: session.status,
    client_reference_id: session.client_reference_id,
    customer: session.customer,
    payment_intent: session.payment_intent,
    metadata: session.metadata,
  };
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!signature || !secret.startsWith("whsec_")) {
    return NextResponse.json({ received: false, granted: false }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ received: false, granted: false }, { status: 400 });
  }

  const session = sessionFromEvent(event);
  if (!session) {
    return NextResponse.json({ received: true, granted: false });
  }

  try {
    const result = await grantCheckoutSession(session, { upsert: upsertEntitlement });
    if (!result.granted) {
      return NextResponse.json({ received: true, granted: false });
    }
  } catch {
    return NextResponse.json({ received: true, granted: false }, { status: 500 });
  }

  return NextResponse.json({ received: true, granted: true });
}
