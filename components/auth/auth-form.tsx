"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/src/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export function AuthForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage("Enter your email address to continue.");
      return;
    }

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMessage(
        "We could not send the sign-in email. Check that Supabase is configured, then try again.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-border/60 bg-surface/60 px-5 py-6">
        <p className="text-sm font-semibold text-foreground">Check your email</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We sent a sign-in link to{" "}
          <span className="font-medium text-foreground">{email.trim()}</span>.
          Open it to finish signing in and unlock your Starter Kit.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setErrorMessage(null);
          }}
          className="mt-4 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="auth-email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === "sending"}
          placeholder="you@company.com"
          className="mt-1.5 w-full rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {status === "sending" ? "Sending link…" : "Continue with Email"}
      </button>

      <p className="text-center text-xs text-muted">
        Free account. No credit card required.
      </p>
      <p className="text-center text-xs text-muted">
        Already have an account? Use the same email — we&apos;ll send a sign-in
        link.
      </p>
    </form>
  );
}
