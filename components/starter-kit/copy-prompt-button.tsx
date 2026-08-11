"use client";

import { useState } from "react";

type CopyPromptButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export function CopyPromptButton({
  text,
  label = "Copy Prompt",
  className = "",
}: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setError(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy automatically. Select the text and copy manually.");
      setCopied(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {copied ? "Copied" : label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-amber-800 dark:text-amber-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
