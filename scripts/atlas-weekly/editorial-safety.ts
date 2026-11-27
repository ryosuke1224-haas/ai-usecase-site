export function sensitiveEditorialText(text: string): boolean {
  return /atlas-note:|\b[A-Z]:\\(?:Users|dev)\\|\/Users\/[^/\s]+\/|\b(?:sk-[\w-]{16,}|gh[pousr]_[\w]{20,}|github_pat_[\w]{20,})|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:password|secret|api[_ -]?key|token)\s*[:=]\s*["']?[\w+/=-]{12,}/i.test(text);
}
