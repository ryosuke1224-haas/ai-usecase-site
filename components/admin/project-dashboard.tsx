import Link from "next/link";
import { EditorialForm } from "@/components/admin/editorial-form";
import { ReviewForm } from "@/components/admin/review-form";
import {
  AnalyticsSection,
  BacklogSection,
  CustomersSection,
  HistorySection,
  OverviewSection,
  RevenueSection,
  RoadmapSection,
} from "@/components/admin/monitor-sections";
import type { ConsoleData } from "@/src/lib/admin/load-console";
import type { DashboardModel } from "@/src/lib/admin/dashboard-model";
import { ADMIN_SECTIONS, adminProjectHref, type AdminSection, type DashboardRange } from "@/src/lib/admin/range";
import type { ReviewItem } from "@/src/lib/admin/review";

const SECTION_LABELS: Record<AdminSection, string> = {
  overview: "Overview",
  review: "Review Queue",
  products: "Products",
  content: "Content",
  operations: "Operations",
  analytics: "Analytics",
  customers: "Customers",
  revenue: "Revenue",
  roadmap: "Roadmap",
  backlog: "Backlog",
  history: "History",
};

const NOTICES: Record<string, string> = {
  saved: "Decision saved. Nothing was published or sent.",
  unchanged: "That item already has this decision.",
  closed: "Published, sent, and archived items stay unchanged.",
  note: "Add a short note before requesting changes or rejecting.",
  refused: "That decision was not saved.",
  unavailable: "Review storage is not available yet. Apply the Atlas review migration.",
  saved_note: "自分の視点を保存しました。公開はしていません。",
  revision_ready: "反映後の本文を用意しました。採用するまで記事は変わりません。",
  accepted: "反映後の本文を採用しました。公開には、あらためて承認が必要です。",
  kept: "今の本文を残しました。",
  published: "記事を公開しました。",
  confirm: "公開する前に確認チェックが必要です。",
};

function targetFor(item: ReviewItem): "blog" | "newsletter" | "review" | null {
  if (!item.mutable) return null;
  if (item.source === "articles") return "blog";
  if (item.source === "newsletter_issues") return "newsletter";
  if (item.source === "review_items") return "review";
  return null;
}

function ItemCard({
  item,
  section,
  range,
}: {
  item: ReviewItem;
  section: AdminSection;
  range: DashboardRange;
}) {
  const target = targetFor(item);
  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4">
      <p className="font-mono text-xs text-muted">{item.type} · {item.status}</p>
      <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
      <p className="mt-2 text-xs text-muted">{item.createdAt ?? "No date"} · {item.qa}</p>
      {item.sources && item.sources.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs">
          {item.sources.map((url) => (
            <li key={url}><a className="break-all text-accent hover:underline" href={url} rel="noreferrer">{url}</a></li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs">
        {item.previewHref ? <Link className="font-medium text-accent hover:underline" href={item.previewHref}>Preview</Link> : "No public preview"}
        {item.relatedHref ? <> · <Link className="font-medium text-accent hover:underline" href={item.relatedHref}>{item.relatedLabel ?? "Related"}</Link></> : null}
      </p>
      {target ? <ReviewForm item={item} target={target} section={section} range={range} /> : (
        <p className="mt-3 text-xs leading-relaxed text-muted">This record comes from local Atlas memory. Decisions stay there until a later automation inserts a review item.</p>
      )}
      {target === "blog" ? <EditorialForm item={item} section={section} range={range} /> : null}
    </article>
  );
}

const FUTURE_ACTIONS = [
  "Run Weekly Atlas",
  "Generate Blog Candidates",
  "Generate Newsletter Draft",
  "Generate Blueprint Candidates",
  "Run QA",
  "Publish Approved Items",
];

export function ProjectDashboard({
  model,
  section,
  consoleData,
  notice,
}: {
  model: DashboardModel;
  section: AdminSection;
  consoleData: ConsoleData;
  notice: string | null;
}) {
  const range = model.range;
  const blogCounts = (status: string) => consoleData.articles.filter((item) => item.status === status).length;
  const issueCounts = (status: string) => consoleData.issues.filter((item) => item.status === status).length;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="font-mono text-xs font-semibold tracking-wider text-accent">PRIVATE</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Operations</h1>
      <p className="mt-2 text-sm text-muted">Signed in as {model.viewerEmail}. Project record updated {model.updated}.</p>
      {notice && NOTICES[notice] ? <p role="status" className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm">{NOTICES[notice]}</p> : null}
      <nav aria-label="Admin sections" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {ADMIN_SECTIONS.map((item) => (
          <Link
            key={item}
            href={adminProjectHref(item, range)}
            aria-current={item === section ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-lg border px-3 text-sm font-medium ${item === section ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}
          >
            {SECTION_LABELS[item]}
          </Link>
        ))}
      </nav>
      {section === "overview" || section === "analytics" || section === "customers" || section === "revenue" || section === "products" ? (
        <nav aria-label="Date range" className="mt-4 flex flex-wrap gap-2">
          {(["today", "7d", "30d"] as const).map((item) => (
            <Link key={item} href={adminProjectHref(section, item)} aria-current={item === range ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${item === range ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}>
              {item === "today" ? "Today" : item === "7d" ? "Last 7 days" : "Last 30 days"}
            </Link>
          ))}
        </nav>
      ) : null}
      <div className="mt-8">
        {section === "overview" ? <OverviewSection model={model} waiting={consoleData.queue.length} /> : null}
        {section === "analytics" ? <AnalyticsSection model={model} /> : null}
        {section === "customers" ? <CustomersSection model={model} /> : null}
        {section === "revenue" ? <RevenueSection model={model} /> : null}
        {section === "roadmap" ? <RoadmapSection model={model} /> : null}
        {section === "backlog" ? <BacklogSection model={model} /> : null}
        {section === "history" ? <HistorySection model={model} actions={consoleData.actions} /> : null}
        {section === "review" ? (
          <section aria-labelledby="review-heading">
            <h2 id="review-heading" className="text-xl font-semibold tracking-tight">Review Queue</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Blueprint candidates, blog drafts, newsletter drafts, and content updates. Approve, needs changes, and reject do not publish or send.</p>
            {consoleData.storage === "unavailable" ? <p className="mt-4 text-sm text-muted">Article and newsletter storage is not available yet. Atlas memory can still be read on this machine.</p> : null}
            {consoleData.queue.length === 0 ? <p className="mt-4 text-sm text-muted">Nothing is waiting for review.</p> : (
              <div className="mt-4 grid gap-3">
                {consoleData.queue.map((item) => <ItemCard key={`${item.source}-${item.id}`} item={item} section={section} range={range} />)}
              </div>
            )}
          </section>
        ) : null}
        {section === "content" ? (
          <section aria-labelledby="content-heading">
            <h2 id="content-heading" className="text-xl font-semibold tracking-tight">Content</h2>
            {consoleData.storage === "unavailable" ? <p className="mt-4 text-sm text-muted">Blog and newsletter issue counts appear after the Atlas review migration is applied. Zeros are not shown in their place.</p> : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-border/80 bg-card p-4">
                <h3 className="text-sm font-semibold">Blog</h3>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><dt>Draft</dt><dd>{blogCounts("DRAFT")}</dd></div>
                  <div className="flex justify-between"><dt>Ready for Review</dt><dd>{blogCounts("READY_FOR_REVIEW")}</dd></div>
                  <div className="flex justify-between"><dt>Approved</dt><dd>{blogCounts("APPROVED")}</dd></div>
                  <div className="flex justify-between"><dt>Published</dt><dd>{blogCounts("PUBLISHED")}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-muted">Publish stays a later, explicit action.</p>
              </article>
              <article className="rounded-2xl border border-border/80 bg-card p-4">
                <h3 className="text-sm font-semibold">Newsletter</h3>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><dt>Draft</dt><dd>{issueCounts("DRAFT")}</dd></div>
                  <div className="flex justify-between"><dt>Ready for Review</dt><dd>{issueCounts("READY_FOR_REVIEW")}</dd></div>
                  <div className="flex justify-between"><dt>Approved</dt><dd>{issueCounts("APPROVED")}</dd></div>
                  <div className="flex justify-between"><dt>Sent</dt><dd>{issueCounts("SENT")}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-muted">Preview, schedule, and send are not connected. Subscriber counts stay on Overview.</p>
              </article>
            </div>
            )}
            {model.blog.state === "value" ? <p className="mt-4 text-sm text-muted">Stored articles: {model.blog.total}. Needs changes {model.blog.needsChanges}. Rejected {model.blog.rejected}.</p> : <p className="mt-4 text-sm text-muted">{model.blog.detail}</p>}
          </section>
        ) : null}
        {section === "products" ? (
          <section aria-labelledby="products-heading">
            <h2 id="products-heading" className="text-xl font-semibold tracking-tight">Products</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Candidate, Build, EN QA, JA Localize, JA QA, READY_FOR_REVIEW, APPROVED, then PUBLISHED. This page does not provision Stripe or deploy.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <caption className="sr-only">Product operations</caption>
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">Product</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Stage</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Localization</th>
                    <th scope="col" className="py-2 pr-3 font-medium">QA</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Pricing</th>
                    <th scope="col" className="py-2 font-medium">Publish</th>
                  </tr>
                </thead>
                <tbody>
                  {consoleData.products.map((product) => (
                    <tr key={product.slug} className="border-b border-border/70 align-top">
                      <td className="py-3 pr-3"><span className="font-medium">{product.title}</span><span className="mt-1 block font-mono text-xs text-muted">{product.slug}</span></td>
                      <td className="py-3 pr-3">{product.stage}</td>
                      <td className="py-3 pr-3">{product.localization}</td>
                      <td className="py-3 pr-3">{product.qa}</td>
                      <td className="py-3 pr-3">{product.pricing}</td>
                      <td className="py-3">{product.publish}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mt-8 text-sm font-semibold">Checkout performance</h3>
            <p className="mt-2 text-sm text-muted">{model.rangeLabel}. {model.analytics.state === "value" ? "Product page views count blueprint pages in this range. Admin routes are excluded." : "Product page views are not available for this range."}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">Product</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Page views</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Purchases</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Revenue</th>
                    <th scope="col" className="py-2 font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {model.products.map((product) => (
                    <tr key={product.slug} className="border-b border-border/70">
                      <td className="py-2 pr-3">{product.titleJa}</td>
                      <td className="py-2 pr-3">{product.pageViews}</td>
                      <td className="py-2 pr-3">{product.purchases}</td>
                      <td className="py-2 pr-3">{product.revenue}</td>
                      <td className="py-2">{product.conversion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
        {section === "operations" ? (
          <section aria-labelledby="operations-heading">
            <h2 id="operations-heading" className="text-xl font-semibold tracking-tight">Operations</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{consoleData.nextAction}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-card p-4"><dt className="text-sm text-muted">Running</dt><dd className="mt-1 text-2xl font-semibold">{consoleData.runs.filter((run) => run.outcome === "running").length}</dd></div>
              <div className="rounded-2xl border border-border/80 bg-card p-4"><dt className="text-sm text-muted">Failed</dt><dd className="mt-1 text-2xl font-semibold">{consoleData.runs.filter((run) => run.outcome === "failed").length}</dd></div>
              <div className="rounded-2xl border border-border/80 bg-card p-4"><dt className="text-sm text-muted">Last success</dt><dd className="mt-1 text-sm font-medium">{consoleData.runs.find((run) => run.outcome === "succeeded")?.id ?? "None recorded"}</dd></div>
            </dl>
            {consoleData.runs.length === 0 ? <p className="mt-4 text-sm text-muted">No Atlas run records were found on this machine.</p> : (
              <ul className="mt-4 divide-y divide-border/70 rounded-2xl border border-border/80 bg-card">
                {consoleData.runs.map((run) => (
                  <li key={run.id} className="px-4 py-3 text-sm">
                    <span className="font-medium">{run.id}</span>
                    <span className="mt-1 block text-xs text-muted">{run.outcome} · {run.phase} · {run.mode}{run.updatedAt ? ` · ${run.updatedAt}` : ""}</span>
                    {run.detail ? <span className="mt-1 block text-xs text-muted">{run.detail}</span> : null}
                  </li>
                ))}
              </ul>
            )}
            <h3 className="mt-8 text-sm font-semibold">Later actions</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {FUTURE_ACTIONS.map((label) => (
                <li key={label}><button type="button" disabled className="inline-flex min-h-11 w-full items-center rounded-lg border border-border bg-card px-3 text-sm text-muted">{label}</button></li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted">These buttons do not run a command, provision Stripe, deploy, publish, or send.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
