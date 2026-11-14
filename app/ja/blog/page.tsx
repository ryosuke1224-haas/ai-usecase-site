import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter/signup-form";
import {
  ARTICLE_CATEGORIES,
  articleCategoryLabel,
  formatArticleDate,
  isArticleCategory,
  relatedBlueprintLinks,
  selectFeatured,
  type PublicArticle,
} from "@/src/lib/blog/model";
import { loadPublishedArticles } from "@/src/lib/blog/store";
import { SITE_URL } from "@/src/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await loadPublishedArticles();
  const description = "AIニュース、米国テック、実務でのAI活用を日本語で短くまとめます。";
  return {
    title: "ブログ",
    description,
    alternates: { canonical: `${SITE_URL}/ja/blog` },
    openGraph: {
      title: "ブログ | AI Use Case Atlas",
      description,
      url: `${SITE_URL}/ja/blog`,
      type: "website",
    },
    robots: loaded === null ? { index: false, follow: false } : { index: true, follow: true },
  };
}

function ArticleCard({ article }: { article: PublicArticle }) {
  const related = relatedBlueprintLinks(article.relatedBlueprints);
  return (
    <article className="rounded-2xl border border-border/80 bg-card p-5">
      <p className="text-xs font-semibold text-accent">{articleCategoryLabel(article.category)}</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">
        <Link href={`/ja/blog/${article.slug}`} className="hover:underline">
          {article.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{article.summary}</p>
      <p className="mt-3 text-xs text-muted">{formatArticleDate(article.publishedAt)}</p>
      {related.length > 0 ? (
        <p className="mt-3 text-xs text-foreground">関連テンプレート: {related.map((item) => item.titleJa).join("、")}</p>
      ) : null}
    </article>
  );
}

export default async function JapaneseBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const categoryValue = (await searchParams).category ?? "";
  const category = isArticleCategory(categoryValue) ? categoryValue : null;
  const loaded = await loadPublishedArticles();
  const articles = loaded?.filter((article) => (category ? article.category === category : true)) ?? [];
  const featured = category ? articles[0] ?? null : selectFeatured(articles);
  const rest = featured ? articles.filter((article) => article.slug !== featured.slug) : articles;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold text-accent">日本語ブログ</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">ブログ</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        AIニュース、米国のテック、仕事ですぐ使えるAI活用を、短い日本語で公開します。
      </p>

      <nav aria-label="カテゴリ" className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/ja/blog"
          aria-current={category ? undefined : "page"}
          className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${category ? "border-border bg-card" : "border-accent bg-accent text-accent-foreground"}`}
        >
          すべて
        </Link>
        {ARTICLE_CATEGORIES.map((item) => (
          <Link
            key={item.id}
            href={`/ja/blog?category=${item.id}`}
            aria-current={category === item.id ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${category === item.id ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {loaded === null ? (
        <p className="mt-10 text-sm leading-relaxed text-muted">記事を読み込めませんでした。時間をおいて再度開いてください。</p>
      ) : articles.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border/80 bg-card p-6">
          <h2 className="text-lg font-semibold">{category ? "このカテゴリの公開記事はまだありません" : "公開中の記事はまだありません"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            実務に関係するAIニュースと、テンプレートの更新をここから公開します。下書きは公開ページには出ません。
          </p>
          <Link href="/ja/newsletter" className="mt-4 inline-flex text-sm font-medium text-accent hover:underline">
            更新をメールで受け取る
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          {featured ? (
            <section aria-labelledby="featured-heading">
              <h2 id="featured-heading" className="text-sm font-semibold text-muted">
                注目
              </h2>
              <div className="mt-3">
                <ArticleCard article={featured} />
              </div>
            </section>
          ) : null}
          {rest.length > 0 ? (
            <section aria-labelledby="latest-heading">
              <h2 id="latest-heading" className="text-sm font-semibold text-muted">
                最新
              </h2>
              <div className="mt-3 grid gap-4">
                {rest.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <section className="mt-12 rounded-2xl border border-border/80 bg-surface p-5">
        <h2 className="text-lg font-semibold">ニュースレター</h2>
        <NewsletterSignup source="ja-blog" idPrefix="blog" />
      </section>
    </main>
  );
}
