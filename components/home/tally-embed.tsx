"use client";

import Script from "next/script";
import { useEffect } from "react";

const TALLY_EMBED_PARAMS: Record<string, string> = {
  alignLeft: "1",
  hideTitle: "1",
  transparentBackground: "1",
  dynamicHeight: "1",
};

declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void;
    };
  }
}

/**
 * Builds a Tally embed URL from NEXT_PUBLIC_TALLY_FORM_URL while preserving
 * any existing query params and ensuring required embed options are set.
 */
export function buildTallyEmbedSrc(baseUrl: string): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(TALLY_EMBED_PARAMS)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function loadTallyEmbeds() {
  if (typeof window === "undefined") return;

  if (typeof window.Tally !== "undefined") {
    window.Tally.loadEmbeds();
    return;
  }

  document
    .querySelectorAll<HTMLIFrameElement>("iframe[data-tally-src]:not([src])")
    .forEach((iframe) => {
      const src = iframe.dataset.tallySrc;
      if (src) iframe.src = src;
    });
}

export function TallyEmbed({ formUrl }: { formUrl: string }) {
  const embedSrc = buildTallyEmbedSrc(formUrl);

  useEffect(() => {
    loadTallyEmbeds();
  }, [embedSrc]);

  return (
    <div className="mt-8 w-full rounded-xl border border-border/60 bg-background px-1 py-1 sm:px-2 sm:py-2">
      <iframe
        data-tally-src={embedSrc}
        loading="lazy"
        width="100%"
        height={1048}
        frameBorder={0}
        marginHeight={0}
        marginWidth={0}
        title="What would you like to automate?"
        className="block w-full border-0"
      />
      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="lazyOnload"
        onLoad={loadTallyEmbeds}
        onError={loadTallyEmbeds}
      />
    </div>
  );
}
