import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Home,
  UserRound
} from "lucide-react";
import { getArticle, getArticleReading, getQuotes } from "@/lib/blog";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { ArticleInteractions } from "@/components/ArticleInteractions";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleSidebar } from "@/components/ArticleSidebar";
import { ArticlePostLink } from "@/components/ArticlePostLink";
import { ArticleShare } from "@/components/ArticleShare";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  return a
    ? {
        title: a.seoTitle || a.title,
        description: a.metaDescription || a.excerpt,
        alternates: { canonical: "/articles/" + encodeURIComponent(a.slug) },
        openGraph: {
          type: "article",
          title: a.title,
          description: a.excerpt,
          images: [a.featuredImage]
        }
      }
    : { title: "Article not found" };
}
export default async function ArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  const [user, reading, quotes] = await Promise.all([
    getSession(),
    getArticleReading(a),
    getQuotes(1)
  ]);
  const categoryUrl = "/articles?category=" + encodeURIComponent(a.category);
  const authorCard = a.author ? (
    <section className="article-author" aria-label="About the author">
      <span className="reader-avatar author-avatar" aria-hidden="true">
        {Array.from(a.author.name)[0]}
      </span>
      <div>
        <h2>{a.author.name}</h2>
        {a.author.bio && <p>{a.author.bio}</p>}
        <Link className="text-link" href={"/articles?author=" + a.author.id}>
          View author’s articles <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  ) : null;
  return (
    <div className="container article-page">
      <div className="article-layout">
        <div className="article-main-column">
          <nav className="article-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={12} />
            <Link href="/articles">Articles</Link>
            <ChevronRight size={12} />
            <Link href={categoryUrl}>{a.category}</Link>
            <ChevronRight size={12} />
            <span aria-current="page" lang={a.language}>
              {a.title}
            </span>
          </nav>
          <article className="article-detail">
            <header className="article-heading">
              <Link className="article-category-badge" href={categoryUrl}>
                {a.category}
              </Link>
              <h1 lang={a.language}>{a.title}</h1>
              <p className="article-excerpt" lang={a.language}>
                {a.excerpt}
              </p>
              <div className="article-byline">
                {a.author && (
                  <Link href={"/articles?author=" + a.author.id}>
                    <UserRound size={15} /> By {a.author.name}
                  </Link>
                )}
                <span>
                  <CalendarDays size={15} />
                  <time dateTime={a.publishedAt}>
                    {formatDate(a.publishedAt)}
                  </time>
                </span>
                <span>
                  <Clock3 size={15} />
                  {a.readingTime} min read
                </span>
              </div>
            </header>
            <div className="article-featured-image">
              <Image
                src={a.featuredImage}
                alt=""
                fill
                priority
                sizes="(max-width: 900px) 95vw, (max-width: 1304px) 62vw, 790px"
              />
            </div>
            <div lang={a.language}>
              <ArticleBody content={a.content} />
            </div>
            {!!a.tags?.length && (
              <nav className="tag-list article-tags" aria-label="Article tags">
                {a.tags.map((tag) => (
                  <Link
                    href={"/articles?tag=" + encodeURIComponent(tag)}
                    key={tag}
                  >
                    {tag}
                  </Link>
                ))}
              </nav>
            )}
            {a.id ? (
              <ArticleInteractions
                articleId={a.id}
                loggedIn={Boolean(user)}
                title={a.title}
              >
                {authorCard}
              </ArticleInteractions>
            ) : (
              <>
                <ArticleShare title={a.title} />
                {authorCard}
                <section className="comments">
                  <h2>Comments</h2>
                  <p className="notice">
                    Demo article. Saving, likes, and comments become available
                    after connecting MongoDB.
                  </p>
                </section>
              </>
            )}
          </article>
          <section
            className="related-posts"
            aria-labelledby="related-posts-title"
          >
            <div className="reading-heading">
              <h2 id="related-posts-title">Related Posts</h2>
              <Link href="/articles">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {reading.related.length ? (
              <div className="related-post-grid">
                {reading.related.map((post) => (
                  <ArticlePostLink article={post} key={post.slug} />
                ))}
              </div>
            ) : (
              <p className="small-note">
                More reading will appear here as new articles are published.
              </p>
            )}
          </section>
        </div>
        <ArticleSidebar
          reading={reading}
          quotes={quotes}
          category={a.category}
        />
      </div>
    </div>
  );
}
