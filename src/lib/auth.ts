import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { authPath } from "@/src/lib/blueprints";

export type AtlasUser = {
  id: string;
  email: string | undefined;
};

/** Returns the authenticated user, or null when logged out / Supabase is unset. */
export async function getCurrentUser(): Promise<AtlasUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

/**
 * Requires authentication for a protected route. Redirects to /auth while
 * preserving the intended destination in `next`.
 */
export async function requireUser(returnPath: string): Promise<AtlasUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(authPath(returnPath));
  }
  return user;
}
