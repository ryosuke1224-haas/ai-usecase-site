import type { DashboardModel, KpiCard, MetricState, OverviewCard } from "@/src/lib/admin/dashboard-model";

function stateClass(state: MetricState): string {
  if (state === "value") return "text-3xl font-semibold tracking-tight text-foreground";
  return "text-base font-semibold text-muted";
}

function statusClass(status: string): string {
  if (status === "LIVE") return "text-emerald-700 dark:text-emerald-400";
  if (status === "IN_PROGRESS") return "text-accent";
  return "text-muted";
}

function Kpi({ card }: { card: KpiCard }) {
  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4">
      <h3 className="text-sm font-medium text-muted">{card.label}</h3>
      <p className={`mt-2 ${stateClass(card.state)}`}>{card.display}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{card.detail}</p>
    </article>
  );
}

function OverviewCardView({ card }: { card: OverviewCard }) {
  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4">
      <h3 className="text-sm font-medium text-muted">{card.label}</h3>
      <p className={`mt-2 text-lg font-semibold ${statusClass(card.value)}`}>{card.value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{card.detail}</p>
    </article>
  );
}

export function OverviewSection({ model, waiting }: { model: DashboardModel; waiting: number }) {
  return (
    <>
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="text-xl font-semibold tracking-tight">Overview</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {model.overview.map((card) => (
            <OverviewCardView key={card.id} card={card} />
          ))}
        </div>
      </section>
      <section aria-labelledby="kpi-heading" className="mt-10">
        <h2 id="kpi-heading" className="text-xl font-semibold tracking-tight">{model.rangeLabel}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {model.kpis.map((card) => (
            <Kpi key={card.id} card={card} />
          ))}
        </div>
      </section>
      <p className="mt-6 text-sm text-muted">Open review items: {waiting}. Approving an item does not publish or send it.</p>
    </>
  );
}

export function AnalyticsSection({ model }: { model: DashboardModel }) {
  const analytics = model.analytics;
  const unavailable = analytics.state === "value" ? "Not available" : analytics.headline;
  return (
    <section aria-labelledby="analytics-heading">
      <h2 id="analytics-heading" className="text-xl font-semibold tracking-tight">Analytics</h2>
      <p className="mt-2 text-sm font-medium">{analytics.headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{analytics.detail}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {model.kpis.map((card) => (
          <Kpi key={card.id} card={card} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AnalyticsList
          title="Top pages"
          empty="No pages in this range."
          rows={analytics.topPages?.map((row) => ({ key: row.path, label: row.path, value: String(row.pageViews) })) ?? null}
          unavailable={unavailable}
        />
        <AnalyticsList
          title="Visitors by country"
          empty="No countries in this range."
          rows={
            analytics.countries?.map((row) => ({
              key: row.code,
              label: row.label,
              value: row.share === null ? String(row.visitors) : `${row.visitors} · ${row.share}%`,
            })) ?? null
          }
          unavailable={unavailable}
        />
        <AnalyticsList
          title="Top referrers"
          empty="No referrers in this range."
          rows={analytics.referrers?.map((row) => ({ key: row.label, label: row.label, value: String(row.pageViews) })) ?? null}
          unavailable={unavailable}
        />
        <AnalyticsList
          title="Devices"
          empty="No devices in this range."
          rows={analytics.devices?.map((row) => ({ key: row.label, label: row.label, value: String(row.visitors) })) ?? null}
          unavailable={unavailable}
        />
        <AnalyticsList
          title="Browsers"
          empty="No browsers in this range."
          rows={analytics.browsers?.map((row) => ({ key: row.label, label: row.label, value: String(row.visitors) })) ?? null}
          unavailable={unavailable}
        />
        <AnalyticsList
          title="Operating systems"
          empty="No operating systems in this range."
          rows={
            analytics.operatingSystems?.map((row) => ({
              key: row.label,
              label: row.label,
              value: String(row.visitors),
            })) ?? null
          }
          unavailable={unavailable}
        />
      </div>
      {analytics.state === "value" ? null : (
        <p className="mt-4 text-sm leading-relaxed text-foreground">Next integration: {analytics.providerNeeded}</p>
      )}
    </section>
  );
}

function AnalyticsList({
  title,
  empty,
  rows,
  unavailable,
}: {
  title: string;
  empty: string;
  rows: { key: string; label: string; value: string }[] | null;
  unavailable: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows === null ? <p className="mt-2 text-sm text-muted">{unavailable}</p> : rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ol className="mt-2 divide-y divide-border/70 rounded-2xl border border-border/80 bg-card">
          {rows.map((row) => (
            <li key={row.key} className="flex items-baseline justify-between gap-4 px-4 py-2 text-sm">
              <span className="break-all">{row.label}</span>
              <span className="shrink-0 font-medium">{row.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function RevenueSection({ model }: { model: DashboardModel }) {
  return (
    <section aria-labelledby="revenue-heading">
      <h2 id="revenue-heading" className="text-xl font-semibold tracking-tight">Revenue</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{model.revenue.detail}</p>
      {model.revenue.state === "value" ? (
        <>
          <p className="mt-4 text-sm">Successful purchases: <span className="font-semibold">{model.revenue.purchaseCount}</span></p>
          {model.revenue.byCurrency.length === 0 ? <p className="mt-3 text-sm text-muted">No revenue in this range.</p> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <caption className="sr-only">Revenue by currency</caption>
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th scope="col" className="py-2 pr-4 font-medium">Currency</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Revenue</th>
                    <th scope="col" className="py-2 font-medium">Purchases</th>
                  </tr>
                </thead>
                <tbody>
                  {model.revenue.byCurrency.map((row) => (
                    <tr key={row.key} className="border-b border-border/70">
                      <td className="py-2 pr-4">{row.label}</td>
                      <td className="py-2 pr-4 font-medium">{row.amountLabel}</td>
                      <td className="py-2">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {model.revenue.byProduct.length > 0 ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <caption className="mb-2 text-left font-medium text-foreground">Revenue by product</caption>
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th scope="col" className="py-2 pr-4 font-medium">Product</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Revenue</th>
                    <th scope="col" className="py-2 font-medium">Purchases</th>
                  </tr>
                </thead>
                <tbody>
                  {model.revenue.byProduct.map((row) => (
                    <tr key={row.key} className="border-b border-border/70">
                      <td className="py-2 pr-4">{row.label}</td>
                      <td className="py-2 pr-4 font-medium">{row.amountLabel}</td>
                      <td className="py-2">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <h3 className="mt-6 text-sm font-semibold">Recent purchases</h3>
          {model.revenue.recent.length === 0 ? <p className="mt-2 text-sm text-muted">No successful live purchases in this range.</p> : (
            <ul className="mt-3 divide-y divide-border/70 rounded-2xl border border-border/80 bg-card">
              {model.revenue.recent.map((row, index) => (
                <li key={`${index}-${row.when}-${row.amountLabel}`} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium">{row.title}</span>
                    <span className="mt-1 block text-xs text-muted">{row.when}</span>
                  </span>
                  <span className="font-medium">{row.amountLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-4 text-base font-semibold text-muted">{model.revenue.state === "not_available" ? "Not available" : "Not connected"}</p>
      )}
    </section>
  );
}

export function CustomersSection({ model }: { model: DashboardModel }) {
  return (
    <section aria-labelledby="customers-heading">
      <h2 id="customers-heading" className="text-xl font-semibold tracking-tight">Customers</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{model.customers.detail}</p>
      {model.customers.state === "value" ? (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-card p-4"><dt className="text-sm text-muted">Unique customers in range</dt><dd className="mt-1 text-2xl font-semibold">{model.customers.uniqueInRange}</dd></div>
            <div className="rounded-2xl border border-border/80 bg-card p-4"><dt className="text-sm text-muted">Blueprints purchased in range</dt><dd className="mt-1 text-2xl font-semibold">{model.customers.ownedInRange}</dd></div>
            <div className="rounded-2xl border border-border/80 bg-card p-4"><dt className="text-sm text-muted">Unique customers, all time</dt><dd className="mt-1 text-2xl font-semibold">{model.customers.uniqueAllTime}</dd></div>
            <div className="rounded-2xl border border-border/80 bg-card p-4"><dt className="text-sm text-muted">Active blueprints, all time</dt><dd className="mt-1 text-2xl font-semibold">{model.customers.ownedAllTime}</dd></div>
          </dl>
          <h3 className="mt-6 text-sm font-semibold">Recent customers</h3>
          {model.customers.recent.length === 0 ? <p className="mt-2 text-sm text-muted">No live-checkout customers in this range.</p> : (
            <ul className="mt-3 space-y-3">
              {model.customers.recent.map((customer, index) => (
                <li key={`${index}-${customer.email}`} className="rounded-2xl border border-border/80 bg-card p-4">
                  <p className="text-sm font-medium">{customer.email}</p>
                  <ul className="mt-3 space-y-2">
                    {customer.products.map((product) => (
                      <li key={`${product.slug}-${product.purchasedAt}`} className="text-sm">
                        <span className="font-medium">{product.title}</span>
                        <span className="text-muted"> · {product.slug}</span>
                        <span className="mt-0.5 block text-xs text-muted">{product.status} · {product.purchasedAt}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : <p className="mt-4 text-base font-semibold text-muted">Not connected</p>}
    </section>
  );
}

export function RoadmapSection({ model }: { model: DashboardModel }) {
  return (
    <section aria-labelledby="roadmap-heading">
      <h2 id="roadmap-heading" className="text-xl font-semibold tracking-tight">Roadmap</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">Now, next, and later come from the project record. This page does not write a second copy.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {([["Now", model.roadmap.now], ["Next", model.roadmap.next], ["Later", model.roadmap.later]] as const).map(([label, items]) => (
          <div key={label} className="rounded-2xl border border-border/80 bg-card p-4">
            <h3 className="text-sm font-semibold">{label}</h3>
            <ul className="mt-3 space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.note}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-6">
        {model.statusGroups.map((group) => (
          <div key={group.status}>
            <h3 className={`font-mono text-xs font-semibold tracking-wider ${statusClass(group.status)}`}>{group.status}</h3>
            {group.areas.length === 0 ? <p className="mt-2 text-sm text-muted">None yet.</p> : (
              <ul className="mt-2 divide-y divide-border/70 rounded-2xl border border-border/80 bg-card">
                {group.areas.map((area) => (
                  <li key={area.id} className="px-4 py-3">
                    <p className="text-sm font-medium">{area.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{area.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function BacklogSection({ model }: { model: DashboardModel }) {
  return (
    <section aria-labelledby="backlog-heading">
      <h2 id="backlog-heading" className="text-xl font-semibold tracking-tight">Backlog</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Planned, backlog, and idea items from the project record. Priority and status stay in that file so the dashboard and the repo do not diverge.
      </p>
      {model.pipeline.length === 0 ? <p className="mt-3 text-sm text-muted">None yet.</p> : (
        <ul className="mt-4 divide-y divide-border/70 rounded-2xl border border-border/80 bg-card">
          {model.pipeline.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <p className="text-sm font-medium">{item.name} <span className="font-mono text-xs text-muted">{item.status}</span></p>
              {item.priority ? <p className="mt-1 text-xs text-muted">Priority {item.priority}</p> : null}
              {item.nextAction ? <p className="mt-1 text-sm text-foreground">Next action: {item.nextAction}</p> : null}
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.note}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HistorySection({
  model,
  actions,
}: {
  model: DashboardModel;
  actions: { action: string; targetTitle: string; fromStatus: string; toStatus: string; createdAt: string | null }[] | null;
}) {
  return (
    <section aria-labelledby="history-heading">
      <h2 id="history-heading" className="text-xl font-semibold tracking-tight">History</h2>
      <ol className="mt-4 space-y-3">
        {model.recentChanges.map((change) => (
          <li key={`${change.date}-${change.title}`} className="rounded-2xl border border-border/80 bg-card p-4">
            <p className="font-mono text-xs text-muted">{change.date}{change.kind ? ` · ${change.kind}` : ""}</p>
            <p className="mt-1 text-sm font-medium">{change.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{change.summary}</p>
          </li>
        ))}
      </ol>
      <h3 className="mt-8 text-sm font-semibold">Admin decisions</h3>
      {actions === null ? <p className="mt-2 text-sm text-muted">The action log is not available until the Atlas review migration is applied.</p> : actions.length === 0 ? <p className="mt-2 text-sm text-muted">No approve, reject, or needs-changes decisions yet.</p> : (
        <ul className="mt-3 divide-y divide-border/70 rounded-2xl border border-border/80 bg-card">
          {actions.map((action, index) => (
            <li key={`${action.createdAt ?? "action"}-${index}`} className="px-4 py-3 text-sm">
              <span className="font-medium">{action.action}</span> {action.targetTitle}
              <span className="mt-1 block text-xs text-muted">{action.fromStatus} → {action.toStatus}{action.createdAt ? ` · ${action.createdAt}` : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
