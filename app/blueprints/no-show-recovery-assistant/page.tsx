import type { Metadata } from "next";
import { NoShowPublicView } from "@/components/premium/no-show-recovery-assistant/public-view";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";

const copy = noShowCopy("en");

export const metadata: Metadata = {
  title: copy.publicTitle,
  description: copy.publicBody,
  alternates: { canonical: "/blueprints/no-show-recovery-assistant" },
  robots: { index: false, follow: false },
};

export default function NoShowRecoveryAssistantPage() {
  return <NoShowPublicView locale="en" pathLocale={null} />;
}
