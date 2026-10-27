import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Refreshes the Auth session cookies on every matched request.
 * Must run in the Next.js proxy so Server Components receive a valid session.
 */
export async function updateSession(request: NextRequest, requestHeaders = new Headers(request.headers)) {
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const env = getSupabaseEnv();
  if (!env) {
    return response;
  }

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        const headers = new Headers(request.headers);
        const locale = requestHeaders.get("x-atlas-locale");
        if (locale) headers.set("x-atlas-locale", locale);
        response = NextResponse.next({
          request: { headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validates/refreshes the JWT. Do not use getSession() here.
  await supabase.auth.getUser();

  return response;
}
