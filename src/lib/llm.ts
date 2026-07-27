/**
 * LLM capability abstraction.
 *
 * Workflows that need "an LLM" list one of these slugs in requiredApis.
 * The matching system treats them as interchangeable — the user only
 * needs one compatible provider.
 */

export const LLM_SLUGS = new Set([
  "openai-api",
  "anthropic-claude-api",
  "google-gemini-api",
]);

export const LLM_PROVIDER_LABELS: Record<string, string> = {
  "openai-api": "OpenAI",
  "anthropic-claude-api": "Claude",
  "google-gemini-api": "Gemini",
};

export const LLM_CAPABILITY_LABEL = "AI model / LLM — choose one";
export const LLM_COMPATIBLE_SUMMARY = Object.values(LLM_PROVIDER_LABELS).join(" · ");

export function isLlmSlug(slug: string): boolean {
  return LLM_SLUGS.has(slug);
}

export function hasAnyLlm(slugs: Iterable<string>): boolean {
  for (const s of slugs) {
    if (LLM_SLUGS.has(s)) return true;
  }
  return false;
}
