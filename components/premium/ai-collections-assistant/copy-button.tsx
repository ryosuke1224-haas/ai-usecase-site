"use client";

import { useEffect, useRef, useState } from "react";
import { PRIMARY_BUTTON } from "./styles";
import { useHydrated } from "./use-hydrated";

type CopyButtonProps = {
  text: string;
  label: string;
  className?: string;
};

export function CopyButton({ text, label, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetTimer = useRef<number | null>(null);
  const hydrated = useHydrated();

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    setError(null);
    try {
      await copyToClipboard(text);
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setError(
        "Could not copy automatically. Select the text above and copy it manually.",
      );
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleCopy}
        disabled={!hydrated}
        className={PRIMARY_BUTTON}
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

/**
 * Copy the exact string during the click.
 * A textarea would turn line breaks into CRLF, and awaiting
 * navigator.clipboard.writeText can stall the click until the page is frozen.
 */
function copyToClipboard(value: string): void {
  const host = document.createElement("pre");
  host.textContent = value;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.whiteSpace = "pre";
  host.style.opacity = "0";
  document.body.appendChild(host);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(host);
  selection?.removeAllRanges();
  selection?.addRange(range);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  selection?.removeAllRanges();
  host.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}
