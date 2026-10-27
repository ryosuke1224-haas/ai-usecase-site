import type { Metadata } from "next";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { GoogleAdsConfig } from "@/components/google-ads-config";
import { Header } from "@/components/header";
import { ContentProvider } from "@/src/content/content-context";
import { loadPublishedContent } from "@/src/content/load-published";
import { isUiLocale, type UiLocale } from "@/src/lib/i18n/locale";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

async function requestLocale(): Promise<UiLocale | null> {
  const value = (await headers()).get("x-atlas-locale");
  return value && isUiLocale(value) ? value : null;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await requestLocale();
  const content = loadPublishedContent();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  return (
    <html
      lang={locale === "ja" ? "ja" : "en"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ContentProvider content={content}>
          <Header locale={locale} />
          <div className="flex-1">{children}</div>
          <Footer locale={locale} />
        </ContentProvider>
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        {googleAdsId ? <GoogleAdsConfig adsId={googleAdsId} /> : null}
      </body>
    </html>
  );
}
