import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  UserRound
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ArticleCardData } from "@/types";

function ArticleMeta({ article }: { article: ArticleCardData }) {
  return (
    <div className="directory-meta">
      {article.authorName && (
        <span>
          <UserRound aria-hidden="true" size={14} /> {article.authorName}
        </span>
      )}
      <span>
        <CalendarDays aria-hidden="true" size={14} />
        <time dateTime={article.publishedAt}>
          {formatDate(article.publishedAt)}
        </time>
      </span>
      <span>
        <Clock3 aria-hidden="true" size={14} /> {article.readingTime} min read
      </span>
    </div>
  );
}

export function LeadArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="directory-lead-card" lang={article.language ?? "en"}>
      <Link
        href={`/articles/${article.slug}`}
        aria-label={`Read ${article.title}`}
      >
        <div className="directory-lead-image">
          <Image
            src={article.featuredImage}
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 100vw, 62vw"
          />
        </div>
        <div className="directory-lead-copy">
          <span className="directory-category">{article.category}</span>
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
          <div className="directory-lead-footer">
            <ArticleMeta article={article} />
            <span className="directory-read-link">
              Read article <ArrowRight aria-hidden="true" size={16} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function SecondaryArticleCard({
  article
}: {
  article: ArticleCardData;
}) {
  return (
    <article
      className="directory-secondary-card"
      lang={article.language ?? "en"}
    >
      <Link
        href={`/articles/${article.slug}`}
        aria-label={`Read ${article.title}`}
      >
        <div className="directory-secondary-image">
          <Image
            src={article.featuredImage}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 35vw"
          />
        </div>
        <div className="directory-secondary-copy">
          <span className="directory-category">{article.category}</span>
          <h3>{article.title}</h3>
          <ArticleMeta article={article} />
        </div>
      </Link>
    </article>
  );
}

export function CompactArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="directory-compact-card" lang={article.language ?? "en"}>
      <Link
        href={`/articles/${article.slug}`}
        aria-label={`Read ${article.title}`}
      >
        <div className="directory-compact-image">
          <Image
            src={article.featuredImage}
            alt=""
            fill
            sizes="(max-width: 620px) 35vw, 16vw"
          />
        </div>
        <div className="directory-compact-copy">
          <span className="directory-category">{article.category}</span>
          <h3>{article.title}</h3>
          <ArticleMeta article={article} />
        </div>
      </Link>
    </article>
  );
}

export function PopularArticles({ articles }: { articles: ArticleCardData[] }) {
  return (
    <section className="directory-popular" aria-labelledby="popular-heading">
      <h2 id="popular-heading">Popular articles</h2>
      {articles.length ? (
        <ol>
          {articles.map((article, index) => (
            <li key={article.slug} lang={article.language ?? "en"}>
              <span className="directory-popular-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link href={`/articles/${article.slug}`}>
                <strong>{article.title}</strong>
                <span>
                  {article.viewCount?.toLocaleString()}{" "}
                  {article.viewCount === 1 ? "view" : "views"} ·{" "}
                  {article.readingTime} min read
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="directory-inline-empty">
          Popular reading will appear after published articles receive views.
        </p>
      )}
    </section>
  );
}

export function TopicDirectory({
  categories
}: {
  categories: Array<{ id: string; name: string; count: number }>;
}) {
  return (
    <section className="directory-topics" aria-labelledby="topics-heading">
      <div className="directory-section-heading">
        <h2 id="topics-heading">Browse by topic</h2>
        <Link href="/categories">
          View all categories <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </div>
      {categories.length ? (
        <div className="directory-topic-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/articles?category=${encodeURIComponent(category.name)}`}
            >
              <BookOpen aria-hidden="true" size={25} />
              <span>
                <strong>{category.name}</strong>
                <small>
                  {category.count}{" "}
                  {category.count === 1 ? "article" : "articles"}
                </small>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="directory-inline-empty">
          Topics will appear when published articles are available.
        </p>
      )}
    </section>
  );
}
