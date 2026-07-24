import Script from "next/script";

type GoogleAdsConfigProps = {
  adsId: string;
};

/**
 * Configures Google Ads on the existing gtag/dataLayer queue.
 * Does not load gtag.js — that is handled by GoogleAnalytics.
 */
export function GoogleAdsConfig({ adsId }: GoogleAdsConfigProps) {
  return (
    <Script
      id="google-ads-config"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('config', '${adsId}');
        `,
      }}
    />
  );
}
