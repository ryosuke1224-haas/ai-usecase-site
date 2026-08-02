import Link from "next/link";
import type { UseCase } from "@/src/types";
import { loadPublishedContent } from "@/src/content/load-published";
import { createContentResolver } from "@/src/lib/resolve";
import { Badge } from "@/components/ui/detail";

export function RequirementsPanel({ useCase }: { useCase: UseCase }) {
  const isGoogleAdsAudit = useCase.slug === "google-ads-performance-coach";
  const { resolveApiName, resolveDataSourceName } =
    createContentResolver(loadPublishedContent());
  return (
    <div className="rounded-xl border-2 border-accent/20 bg-accent/5">
      <div className="border-b border-accent/20 px-5 py-3">
        <h2 className="font-semibold">
          {isGoogleAdsAudit ? "What you need to run this" : "What you need to build this"}
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          {isGoogleAdsAudit
            ? "Start with manual exports. APIs are optional when you automate recurring reviews."
            : "Connect these tools, give the AI this data, expect these outputs."}
        </p>
      </div>

      <div className="grid divide-y divide-accent/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:divide-y-0">
        <RequirementBlock
          step="1"
          title={isGoogleAdsAudit ? "Automate later" : "Connect"}
          subtitle={isGoogleAdsAudit ? "Optional APIs for recurring runs" : "APIs & tools to set up"}
        >
          <ul className="space-y-2">
            {useCase.requiredApis.map((api) => (
              <li key={api}>
                <Link
                  href={`/apis/${api}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {resolveApiName(api)}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            {isGoogleAdsAudit
              ? "The manual playbook works with exports; no API setup is required for the first audit."
              : "OAuth, API keys, or webhooks depending on the tool."}
          </p>
        </RequirementBlock>

        <RequirementBlock
          step="2"
          title="Gather"
          subtitle="Data sources to pull from"
        >
          <ul className="space-y-2">
            {useCase.requiredDataSources.map((ds) => (
              <li key={ds}>
                <Link
                  href={`/data-sources/${ds}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {resolveDataSourceName(ds)}
                </Link>
              </li>
            ))}
          </ul>
        </RequirementBlock>

        <RequirementBlock
          step="3"
          title="Give to AI"
          subtitle="Inputs per run"
        >
          <ul className="space-y-1.5">
            {useCase.aiInputs.map((input) => (
              <li key={input} className="text-xs text-muted">
                {input}
              </li>
            ))}
          </ul>
        </RequirementBlock>

        <RequirementBlock
          step="4"
          title="Expect"
          subtitle="AI outputs"
        >
          <ul className="space-y-1.5">
            {useCase.aiOutputs.map((output) => (
              <li key={output} className="text-xs text-muted">
                {output}
              </li>
            ))}
          </ul>
        </RequirementBlock>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-accent/20 px-5 py-3">
        <Badge>{useCase.difficulty}</Badge>
        <Badge>{useCase.automationLevel}</Badge>
        <Badge variant="success">{useCase.valuePotential} value</Badge>
        <span className="text-xs text-muted">
          {useCase.noCodeTools.length} no-code · {useCase.lowCodeTools.length}{" "}
          low-code · {useCase.customBuildStack.length} custom options
        </span>
      </div>
    </div>
  );
}

function RequirementBlock({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-accent text-xs font-bold text-accent-foreground">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
