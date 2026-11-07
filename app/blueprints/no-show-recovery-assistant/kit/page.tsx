import type { Metadata } from "next";
import { NoShowKitView } from "@/components/premium/no-show-recovery-assistant/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/no-show-recovery-assistant/styles";
import { requireUser } from "@/src/lib/auth";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { DEMO_PATH, KIT_PATH } from "@/src/lib/premium/no-show-recovery-assistant/demo-data";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-auto px-4 py-10 sm:px-6 sm:py-12";

export const metadata: Metadata = {
  title: "No-show Recovery Assistant Premium Kit",
  description:
    "Prompts, worksheet, recovery log, and review checklist for the No-show Recovery Assistant workflow.",
  alternates: { canonical: "/blueprints/no-show-recovery-assistant/kit" },
  robots: { index: false, follow: false },
};

export default async function NoShowRecoveryAssistantKitPage() {
  const user = await requireUser(KIT_PATH);
  const entitled = await hasActiveEntitlement(user.id, "no-show-recovery-assistant");
  if (!entitled) {
    return (
      <PremiumKitLocked
        demoPath={DEMO_PATH}
        note="You review and send. Nothing is sent automatically. The kit changes nothing."
        className={PAGE}
        linkClassName={FOCUS_RING}
      />
    );
  }

  return <NoShowKitView locale="en" pathLocale={null} />;
}
