"use client";

import Script from "next/script";
import { useEffect } from "react";

const TALLY_EMBED_SCRIPT = "https://tally.so/widgets/embed.js";

const TALLY_EMBED_PARAMS: Record<string, string> = {
  alignLeft: "1",
  hideTitle: "1",
  transparentBackground: "1",
  dynamicHeight: "1",
};

type TallyWindow = Window & {
  Tally?: {
    loadEmbeds: () => void;
  };
};

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

/**
 * Only initialize through Tally.loadEmbeds().
 * Manually assigning iframe.src before Tally is ready loads the form without
 * the parent-side resize listeners, which leaves an internal scrollbar.
 */
function loadTallyEmbeds() {
  if (typeof window === "undefined") return;

  const tally = (window as TallyWindow).Tally;
  if (typeof tally?.loadEmbeds === "function") {
    tally.loadEmbeds();
  }
}

export function TallyEmbed({ formUrl }: { formUrl: string }) {
  const embedSrc = buildTallyEmbedSrc(formUrl);

  useEffect(() => {
    // Iframe has mounted. If the script already loaded first, initialize now.
    loadTallyEmbeds();
  }, [embedSrc]);

  return (
    <div className="mt-8 w-full">
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
        src={TALLY_EMBED_SCRIPT}
        strategy="afterInteractive"
        onLoad={loadTallyEmbeds}
        onReady={loadTallyEmbeds}
      />
    </div>
  );
}
