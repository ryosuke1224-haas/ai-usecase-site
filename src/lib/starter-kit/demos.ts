import "server-only";

import { getUseCaseBySlug } from "@/src/content/load-published";

export type StarterKitDemoTool = {
  key: "chatgpt" | "claude" | "gemini";
  label: string;
  availabilityNote: string;
  embedUrl: string;
};

const FALLBACK_DEMOS: StarterKitDemoTool[] = [
  {
    key: "chatgpt",
    label: "ChatGPT",
    availabilityNote: "Availability may vary by plan.",
    embedUrl:
      "https://app.supademo.com/embed/cmsj5sjvu0g0aqm5s7ozo2cn2?embed_v=2&utm_source=embed",
  },
  {
    key: "claude",
    label: "Claude",
    availabilityNote: "Free plan supported. Usage limits apply.",
    embedUrl:
      "https://app.supademo.com/embed/cmsj61hfm0g97qm5sqxld998x?embed_v=2&utm_source=embed",
  },
  {
    key: "gemini",
    label: "Gemini",
    availabilityNote:
      "Google account required. Availability may depend on account settings.",
    embedUrl:
      "https://app.supademo.com/embed/cmsj6a7z20gelqm5sy979t6w0?embed_v=2&utm_source=embed",
  },
];

/** Prefer live use-case content so Starter Kit demos stay in sync with the public guided demos. */
export function getStarterKitDemoTools(): StarterKitDemoTool[] {
  const useCase = getUseCaseBySlug("ai-daily-inbox-briefing");
  const tools = useCase?.experience?.guidedDemos?.tools;
  if (!tools?.length) return FALLBACK_DEMOS;

  return tools.map((tool) => ({
    key: tool.key,
    label: tool.label,
    availabilityNote: tool.availabilityNote,
    embedUrl: tool.embedUrl,
  }));
}

export function getStarterKitDemoTool(
  key: StarterKitDemoTool["key"],
): StarterKitDemoTool {
  return (
    getStarterKitDemoTools().find((tool) => tool.key === key) ??
    FALLBACK_DEMOS.find((tool) => tool.key === key) ??
    FALLBACK_DEMOS[0]
  );
}
