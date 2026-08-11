import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
  DAILY_INBOX_STARTER_KIT_PATH,
  sanitizeNextPath,
} from "@/src/lib/blueprints";

/**
 * Exchanges the magic-link auth code for a session, then returns the user to
 * their intended destination (defaults to the Daily Inbox Starter Kit).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(
    searchParams.get("next"),
    DAILY_INBOX_STARTER_KIT_PATH,
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const failure = new URL("/auth", origin);
  failure.searchParams.set("next", next);
  failure.searchParams.set("error", "auth");
  return NextResponse.redirect(failure);
}
