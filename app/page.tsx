import type { Metadata } from "next";
import { HomeHero } from "@/components/homepage/home-hero";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
};

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-11rem)] w-full max-w-6xl flex-col justify-center px-6 py-10 sm:py-14">
      <HomeHero />
    </div>
  );
}
