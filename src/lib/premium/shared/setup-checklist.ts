/**
 * Shared setup-checklist wording so every Premium kit names its secondary prompt.
 * Product kits supply the prompt title and usage; prompt logic stays product-owned.
 */
export function secondaryPromptSetupStep(promptTitle: string, usage: string): string {
  return `Name and paste the ${promptTitle} ${usage}. Keep this secondary prompt in your setup so later runs do not skip it.`;
}
