import Link from "next/link";
import { loadPublishedContent } from "@/src/content/load-published";

export function LibraryIndex() {
  const { useCases, apis, dataSources, workflowIdeas } = loadPublishedContent();

  return (
    <section className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-3">
        <h2 className="font-semibold">Reference libraries</h2>
      </div>
      <div className="grid divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        <IndexColumn
          title="Use cases"
          count={useCases.length}
          href="/use-cases"
          items={useCases.slice(0, 5).map((uc) => ({
            label: uc.title,
            href: `/use-cases/${uc.slug}`,
          }))}
        />
        <IndexColumn
          title="APIs"
          count={apis.length}
          href="/apis"
          items={apis.slice(0, 5).map((api) => ({
            label: api.name,
            href: `/apis/${api.slug}`,
          }))}
        />
        <IndexColumn
          title="Data sources"
          count={dataSources.length}
          href="/data-sources"
          items={dataSources.slice(0, 5).map((ds) => ({
            label: ds.name,
            href: `/data-sources/${ds.slug}`,
          }))}
        />
        <IndexColumn
          title="Workflow stacks"
          count={workflowIdeas.length}
          href="/workflow-ideas"
          items={workflowIdeas.map((wf) => ({
            label: wf.title,
            href: "/workflow-ideas",
          }))}
        />
      </div>
    </section>
  );
}

function IndexColumn({
  title,
  count,
  href,
  items,
}: {
  title: string;
  count: number;
  href: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div className="px-5 py-4">
      <Link href={href} className="group flex items-baseline justify-between">
        <h3 className="font-medium group-hover:text-accent">{title}</h3>
        <span className="font-mono text-xs text-muted">{count}</span>
      </Link>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link
              href={item.href}
              className="text-xs text-muted hover:text-accent line-clamp-1"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-3 inline-block text-xs font-medium text-accent hover:underline"
      >
        Browse all →
      </Link>
    </div>
  );
}
