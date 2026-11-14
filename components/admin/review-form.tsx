import { decideReview } from "@/src/lib/admin/decide";
import type { AdminSection, DashboardRange } from "@/src/lib/admin/range";
import type { ReviewItem } from "@/src/lib/admin/review";

export function ReviewForm({
  item,
  target,
  section,
  range,
}: {
  item: ReviewItem;
  target: "blog" | "newsletter" | "review";
  section: AdminSection;
  range: DashboardRange;
}) {
  return (
    <form action={decideReview} className="mt-3 grid gap-2">
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="range" value={range} />
      <label className="text-xs text-muted">
        Note
        <input name="note" maxLength={500} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button name="decision" value="approve" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground">
          Approve
        </button>
        <button name="decision" value="needs_changes" className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium">
          Needs changes
        </button>
        <button name="decision" value="reject" className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium">
          Reject
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted">Approve records a decision. It does not publish or send.</p>
    </form>
  );
}
