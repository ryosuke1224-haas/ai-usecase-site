export const DASHBOARD_RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
] as const;

export type DashboardRange = (typeof DASHBOARD_RANGES)[number]["id"];

const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDashboardRange(value: string | undefined): DashboardRange {
  if (value === "today" || value === "7d" || value === "30d") return value;
  return "7d";
}

export const ADMIN_SECTIONS = [
  "overview",
  "review",
  "products",
  "content",
  "operations",
  "analytics",
  "customers",
  "revenue",
  "roadmap",
  "backlog",
  "history",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export function parseAdminSection(value: string | undefined): AdminSection {
  return ADMIN_SECTIONS.find((section) => section === value) ?? "overview";
}

export function dashboardRangeHref(range: DashboardRange): string {
  return `/admin/project?range=${range}`;
}

export function adminProjectHref(section: AdminSection, range: DashboardRange, notice?: string): string {
  const params = new URLSearchParams({ range, section });
  if (notice) params.set("notice", notice);
  return `/admin/project?${params.toString()}`;
}

export function rangeLabel(range: DashboardRange): string {
  return DASHBOARD_RANGES.find((item) => item.id === range)?.label ?? "Last 7 days";
}

/** Calendar date in Japan. Atlas reporting uses Asia/Tokyo, which has no daylight saving. */
export function tokyoDate(now: Date): { year: number; month: number; day: number } {
  const shifted = new Date(now.getTime() + TOKYO_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function startOfTokyoDay(now: Date): Date {
  const { year, month, day } = tokyoDate(now);
  return new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
}

/** Today, or the last 7 or 30 Tokyo calendar days including today, through `now`. */
export function rangeStart(range: DashboardRange, now: Date): Date {
  const today = startOfTokyoDay(now);
  if (range === "today") return today;
  const extraDays = range === "7d" ? 6 : 29;
  return new Date(today.getTime() - extraDays * DAY_MS);
}

export function instantInRange(ms: number, start: Date, now: Date): boolean {
  return Number.isFinite(ms) && ms >= start.getTime() && ms <= now.getTime();
}

const tokyoDateTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatTokyoDateTime(ms: number): string {
  if (!Number.isFinite(ms)) return "Unknown date";
  return tokyoDateTime.format(new Date(ms));
}
