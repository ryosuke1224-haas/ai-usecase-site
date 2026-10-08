export function redact(input: string): string {
  const plain = input.replace(/\u001b\[[0-9;]*m/g, "");
  return plain
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
      "[redacted-jwt]",
    )
    .replace(/((?:access_token|refresh_token|code|token)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/\b(sb_secret|service_role)_[A-Za-z0-9_-]+/g, "[redacted-secret]");
}

export function tail(input: string, max = 2000): string {
  const cleaned = redact(input).trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(cleaned.length - max);
}
