import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/src/lib/supabase/proxy";

/**
 * Public routes allowed while SITE_MODE=coming-soon.
 * Everything else is redirected to / so unfinished app pages stay private.
 */
const COMING_SOON_PUBLIC_PATHS = new Set([
  "/",
  "/contact",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icon.png",
  "/manifest.webmanifest",
]);

function isComingSoonMode() {
  return process.env.SITE_MODE === "coming-soon";
}

function isStaticAsset(pathname: string) {
  return /\.(?:ico|png|jpg|jpeg|gif|webp|svg|txt|xml|json|webmanifest|woff2?|ttf|css|js|map)$/i.test(
    pathname,
  );
}

export async function proxy(request: NextRequest) {
  // Always refresh the Auth session first so protected routes see current cookies.
  const sessionResponse = await updateSession(request);

  if (!isComingSoonMode()) {
    return sessionResponse;
  }

  const { pathname } = request.nextUrl;

  if (COMING_SOON_PUBLIC_PATHS.has(pathname) || isStaticAsset(pathname)) {
    return sessionResponse;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next.js internals and common static assets.
     * Public pages are allowlisted inside the proxy function for coming-soon mode.
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico).*)",
  ],
};
