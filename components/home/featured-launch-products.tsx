import Link from "next/link";

export type FeaturedLaunchProduct = {
  slug: string;
  href: string;
  title: string;
  body: string;
  cta: string;
};

export function FeaturedLaunchProducts({ products }: { products: FeaturedLaunchProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section id="featured-products" className="mt-16 scroll-mt-24 sm:mt-20">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">注目のテンプレート</h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              href={product.href}
              className="flex h-full flex-col rounded-xl border border-border/70 bg-card px-6 py-6 transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <h3 className="text-lg font-semibold tracking-tight">{product.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{product.body}</p>
              <span className="mt-5 text-sm font-semibold text-accent">{product.cta}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
