import Link from "next/link";

export type ReferenceDirectoryItem = {
  slug: string;
  name: string;
  filterHref: string;
  products: { slug: string; title: string; href: string }[];
};

export function ReferenceDirectory({
  title,
  intro,
  items,
}: {
  title: string;
  intro: string;
  items: ReferenceDirectoryItem[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-4">
        <p className="font-mono text-xs text-muted">{items.length}件</p>
        <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p>
      </header>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.slug} className="rounded-xl border border-border/70 bg-card px-5 py-5">
            <h2 className="text-base font-semibold">{item.name}</h2>
            <ul className="mt-3 space-y-2">
              {item.products.map((product) => (
                <li key={product.slug}>
                  <Link href={product.href} className="text-sm font-medium text-accent hover:underline">
                    {product.title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              <Link href={item.filterHref} className="font-medium text-foreground hover:text-accent">
                一覧で見る
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
