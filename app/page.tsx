import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/home/ComingSoonPage";
import { LiveHomePage } from "@/components/home/LiveHomePage";
import { isComingSoonMode } from "@/src/lib/site-mode";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/site";

const COMING_SOON_TITLE =
  "AI Use Case Atlas — Practical AI Workflows for Small Businesses";
const COMING_SOON_DESCRIPTION =
  "Discover practical ways AI can reduce repetitive work, improve operations, and help small businesses make better decisions.";

export function generateMetadata(): Metadata {
  if (isComingSoonMode()) {
    return {
      title: {
        absolute: COMING_SOON_TITLE,
      },
      description: COMING_SOON_DESCRIPTION,
      alternates: {
        canonical: "/",
      },
      openGraph: {
        title: COMING_SOON_TITLE,
        description: COMING_SOON_DESCRIPTION,
        url: SITE_URL,
      },
    };
  }

  return {
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
}

export default function Home() {
  if (isComingSoonMode()) {
    return <ComingSoonPage />;
  }

  return <LiveHomePage />;
}
