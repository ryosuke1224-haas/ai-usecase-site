import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/blog/article-body";
import { NewsletterSignup } from "@/components/newsletter/signup-form";
import {
  articleCategoryLabel,
  formatArticleDate,
  relatedBlueprintLinks,
} from "@/src/lib/blog/model";
import { loadPublishedArticle, loadPublishedArticles } from "@/src/lib/blog/store";
import { SITE_NAME, SITE_URL } from "@/src/lib/site";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadPublishedArticle(slug);
  if (!article) return { robots: { index: false, follow: false } };
  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.summary;
  const url = `${SITE_URL}/ja/blog/${article.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    robots: { index: true, follow: true },
  };
}

export default async function JapaneseArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await loadPublishedArticle(slug);
  if (!article) notFound();
  const related = relatedBlueprintLinks(article.relatedBlueprints);
  const published = (await loadPublishedArticles()) ?? [];
  const index = published.findIndex((item) => item.slug === article.slug);
  const newer = index > 0 ? published[index - 1] : null;
  const older = index >= 0 && index < published.length - 1 ? published[index + 1] : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold text-accent">
        <Link href="/ja/blog" className="hover:underline">
          ブログ
        </Link>
        <span> · {articleCategoryLabel(article.category)}</span>
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{article.title}</h1>
      <p className="mt-4 text-base leading-relaxed text-muted">{article.summary}</p>
      <p className="mt-3 text-xs text-muted">
        {formatArticleDate(article.publishedAt)}
        {article.displayAuthor ? ` · ${article.displayAuthor}` : ` · ${SITE_NAME}`}
      </p>

      <div className="mt-8">
        <ArticleBody body={article.body} />
      </div>

      {article.sourceUrls.length > 0 ? (
        <section className="mt-10" aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="text-sm font-semibold">
            参照
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {article.sourceUrls.map((url) => (
              <li key={url}>
                <a href={url} className="break-all text-accent underline" rel="noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-10" aria-labelledby="blueprints-heading">
          <h2 id="blueprints-heading" className="text-sm font-semibold">
            関連テンプレート
          </h2>
          <ul className="mt-3 grid gap-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={item.href} className="block rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm font-medium hover:border-accent/40">
                  {item.titleJa}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {newer || older ? (
        <nav aria-label="前後の記事" className="mt-10 grid gap-3 sm:grid-cols-2">
          {newer ? (
            <Link href={`/ja/blog/${newer.slug}`} className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm">
              <span className="block text-xs text-muted">新しい記事</span>
              {newer.title}
            </Link>
          ) : <span />}
          {older ? (
            <Link href={`/ja/blog/${older.slug}`} className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm sm:text-right">
              <span className="block text-xs text-muted">前の記事</span>
              {older.title}
            </Link>
          ) : null}
        </nav>
      ) : null}

      <section className="mt-12 rounded-2xl border border-border/80 bg-surface p-5">
        <h2 className="text-lg font-semibold">ニュースレター</h2>
        <NewsletterSignup source="ja-article" idPrefix="article" />
      </section>
    </main>
  );
}
