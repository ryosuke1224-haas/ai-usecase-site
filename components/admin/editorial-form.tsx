import type { AdminSection, DashboardRange } from "@/src/lib/admin/range";
import { runEditorial } from "@/src/lib/admin/editorial-actions";
import type { ReviewItem } from "@/src/lib/admin/review";

function HiddenFields({
  item,
  section,
  range,
}: {
  item: ReviewItem;
  section: AdminSection;
  range: DashboardRange;
}) {
  return (
    <>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="range" value={range} />
    </>
  );
}

export function EditorialForm({
  item,
  section,
  range,
}: {
  item: ReviewItem;
  section: AdminSection;
  range: DashboardRange;
}) {
  const editorial = item.editorial;
  if (!editorial || item.status === "PUBLISHED" || item.status === "ARCHIVED") return null;
  const pending = editorial.proposedBody?.trim() ? editorial.proposedBody : null;
  return (
    <div className="mt-4 space-y-3 border-t border-border/80 pt-3">
      <p className="text-xs text-muted">
        自分の視点: {editorial.applied ? "反映済み" : "未反映"} · 承認: {item.status} · 公開: 未公開
      </p>
      <form action={runEditorial} className="space-y-2">
        <HiddenFields item={item} section={section} range={range} />
        <label className="block text-xs font-medium" htmlFor={`editorial-${item.id}`}>自分の視点</label>
        <textarea
          id={`editorial-${item.id}`}
          name="editorial_note"
          defaultValue={editorial.note}
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder="事実とは別に、自分の見方を短く書きます。"
        />
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium" name="intent" type="submit" value="save">保存</button>
          <button className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium" name="intent" type="submit" value="apply">編集メモを記事に反映</button>
        </div>
      </form>
      {pending ? (
        <div className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium">現在の本文</p>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-xs">{editorial.body}</pre>
            </div>
            <div>
              <p className="text-xs font-medium">反映後の本文</p>
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-xs">{pending}</pre>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={runEditorial}>
              <HiddenFields item={item} section={section} range={range} />
              <button className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground" name="intent" type="submit" value="accept">反映後の本文を採用</button>
            </form>
            <form action={runEditorial}>
              <HiddenFields item={item} section={section} range={range} />
              <button className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium" name="intent" type="submit" value="keep">今の本文を残す</button>
            </form>
          </div>
        </div>
      ) : null}
      {item.status === "APPROVED" && !pending ? (
        <form action={runEditorial} className="space-y-2">
          <HiddenFields item={item} section={section} range={range} />
          <label className="flex items-start gap-2 text-sm">
            <input className="mt-1" name="confirm" required type="checkbox" value="yes" />
            公開する内容を確認しました
          </label>
          <button className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground" name="intent" type="submit" value="publish">公開する</button>
        </form>
      ) : null}
    </div>
  );
}
