const IGNORED_CONSOLE_ERROR =
  /favicon\.ico|apple-touch-icon|manifest\.webmanifest|ResizeObserver loop|googletagmanager\.com|google-analytics\.com|googleadservices\.com|doubleclick\.net|app\.supademo\.com/i;

export function isIgnoredConsoleError(text: string, locationUrl = ""): boolean {
  return IGNORED_CONSOLE_ERROR.test(`${text} ${locationUrl}`);
}
