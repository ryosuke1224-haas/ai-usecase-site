const STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  READY_FOR_REVIEW: "確認待ち",
  APPROVED: "承認済み",
  NEEDS_CHANGES: "修正待ち",
  REJECTED: "却下済み",
  PUBLISHED: "公開済み",
  SENT: "配信済み",
  ARCHIVED: "保管済み",
};

const TYPE_LABELS: Record<string, string> = {
  BLOG: "ブログ",
  NEWSLETTER: "ニュースレター",
  BLUEPRINT: "Blueprint",
  CONTENT_UPDATE: "コンテンツ更新",
};

export function reviewStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function reviewTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function reviewDecisionHelp(target: "blog" | "newsletter" | "review"): string {
  if (target === "blog") return "承認しても、自動で公開はされません。";
  if (target === "newsletter") return "承認しても、自動で配信はされません。";
  return "承認しても、自動で公開・配信はされません。";
}
