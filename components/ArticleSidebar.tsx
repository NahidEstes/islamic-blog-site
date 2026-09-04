import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Leaf, Search } from "lucide-react";
import { getArticleReading, getQuotes } from "@/lib/blog";
import { ArticlePostLink } from "@/components/ArticlePostLink";

export function ArticleSidebar({
  reading,
  quotes,
  category
}: {
  reading: Awaited<ReturnType<typeof getArticleReading>>;
  quotes: Awaited<ReturnType<typeof getQuotes>>;
  category: string;
}) {
  const quote = quotes[0];
  const recommended = reading.recommended;
  return (
    <aside className="article-sidebar" aria-label="More reading">
      <form
        action="/search"
        className="sidebar-search sidebar-panel"
        role="search"
      >
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          name="q"
          placeholder="Search articles…"
          aria-label="Search articles"
          maxLength={120}
          required
        />
        <button className="button button-green">Search</button>
      </form>
      <section
        className="sidebar-reminder sidebar-panel"
        aria-labelledby="reminder-title"
      >
        <div className="reminder-label">
          <h2 id="reminder-title">A small reminder</h2>
          <Leaf size={25} aria-hidden="true" />
        </div>
        {quote ? (
          <>
            <blockquote>{String(quote.quote)}</blockquote>
            <p>— {String(quote.scholar)}</p>
            {quote.sourceUrl ? (
              <a
                className="text-link"
                href={String(quote.sourceUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {String(quote.source)}
              </a>
            ) : (
              <p className="small-note">{String(quote.source)}</p>
            )}
          </>
        ) : (
          <>
            <p className="editorial-reminder">
              Read thoughtfully.
              <br />
              Keep the source close.
            </p>
            <p className="small-note">
              An editorial reminder: check the original source before sharing a
              quotation.
            </p>
          </>
        )}
      </section>
      <section className="sidebar-panel" aria-labelledby="popular-posts-title">
        <div className="reading-heading">
          <h2 id="popular-posts-title">Popular Posts</h2>
          <Link href="/articles">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {reading.popular.length ? (
          <div className="sidebar-posts">
            {reading.popular.map((a) => (
              <ArticlePostLink key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <p className="small-note">
            More articles will appear here when published.
          </p>
        )}
      </section>
      <section
        className="sidebar-panel"
        aria-labelledby="article-categories-title"
      >
        <div className="reading-heading">
          <h2 id="article-categories-title">Categories</h2>
          <Link href="/categories">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <ul className="sidebar-categories">
          {reading.categories.map((c) => (
            <li key={c.id}>
              <Link
                href={"/articles?category=" + encodeURIComponent(c.name)}
                className={category === c.name ? "current-category" : undefined}
              >
                <BookOpen size={17} aria-hidden="true" />
                <span>{c.name}</span>
                <span
                  className="category-count"
                  aria-label={c.count + " published articles"}
                >
                  {c.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {!reading.categories.length && (
          <p className="small-note">No categories yet.</p>
        )}
      </section>
      {recommended && (
        <section
          className="sidebar-panel suggested-post"
          aria-labelledby="suggested-post-title"
        >
          <h2 id="suggested-post-title">You May Also Like</h2>
          <Link href={"/articles/" + encodeURIComponent(recommended.slug)}>
            <span className="suggested-image">
              <Image
                src={recommended.featuredImage}
                alt=""
                fill
                sizes="(max-width: 900px) 90vw, 320px"
              />
            </span>
            <h3 lang={recommended.language}>{recommended.title}</h3>
            <p lang={recommended.language}>{recommended.excerpt}</p>
            <span className="text-link">
              Read article <ArrowRight size={15} />
            </span>
          </Link>
        </section>
      )}
    </aside>
  );
}
