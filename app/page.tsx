import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Leaf,
  Heart,
  Library,
  PenLine,
  Compass,
  Mail
} from "lucide-react";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import {
  listArticles,
  getArticle,
  getTaxonomies,
  getQuotes,
  getFeaturedArticle,
  getSettings
} from "@/lib/blog";
import { formatDate } from "@/lib/utils";
const icons = [Compass, BookOpen, Library, Heart, PenLine, Leaf];
export default async function HomePage() {
  const [recent, popular, topics, quotes, { homepage }, editorPick] =
    await Promise.all([
      listArticles({ limit: 5 }),
      listArticles({ limit: 3, popular: true }),
      getTaxonomies("category"),
      getQuotes(1),
      getSettings(),
      getFeaturedArticle()
    ]);
  const chosen = homepage.featuredSlug
    ? await getArticle(homepage.featuredSlug)
    : null;
  const featured = chosen ?? editorPick ?? recent.items[0];
  const quote = quotes[0];
  return (
    <div className="container blog-home">
      <section className="intro-grid">
        <div className="intro-copy">
          <p className="eyebrow">A space to learn and reflect</p>
          <h1>{homepage.introHeading}</h1>
          <p>{homepage.introText}</p>
          <span className="intro-rule" aria-hidden="true">
            ✦
          </span>
        </div>
        <div>
          <div className="section-heading">
            <h2>Explore by topic</h2>
            <Link className="text-link" href="/categories">
              View all
            </Link>
          </div>
          <div className="topic-grid">
            {topics.slice(0, 6).map((topic, i) => {
              const Icon = icons[i];
              return (
                <Link
                  className="topic-card"
                  href={"/articles?category=" + encodeURIComponent(topic.name)}
                  key={topic.id}
                >
                  <Icon strokeWidth={1.2} />
                  <span>{topic.name}</span>
                </Link>
              );
            })}
          </div>
          {!topics.length && (
            <p className="small-note">New topics are on their way.</p>
          )}
        </div>
      </section>
      {recent.demo && (
        <p className="notice">
          Demo reading preview. Connect MongoDB to manage your articles.
        </p>
      )}
      <div className="editorial-grid">
        <section>
          <div className="section-heading">
            <h2>Featured article</h2>
            <span className="eyebrow">The editor’s pick</span>
          </div>
          {featured ? (
            <article className="featured-card" lang={featured.language}>
              <Link
                href={"/articles/" + featured.slug}
                className="featured-image"
                aria-label={"Read " + featured.title}
              >
                <Image
                  src={featured.featuredImage}
                  alt=""
                  fill
                  priority
                  sizes="(max-width:480px) 90vw,30vw"
                />
              </Link>
              <div className="featured-copy">
                <span className="status-badge" lang="en">
                  Featured article
                </span>
                <h2>
                  <Link href={"/articles/" + featured.slug}>
                    {featured.title}
                  </Link>
                </h2>
                <p>{featured.excerpt}</p>
                <p className="article-meta" lang="en">
                  {formatDate(featured.publishedAt)} · {featured.readingTime}{" "}
                  min read
                </p>
                <Link
                  className="text-link"
                  lang="en"
                  href={"/articles/" + featured.slug}
                >
                  Read article
                </Link>
              </div>
            </article>
          ) : (
            <div className="empty-state">Our first article is coming soon.</div>
          )}
        </section>
        <section>
          <div className="section-heading">
            <h2>Recent articles</h2>
            <Link className="text-link" href="/articles">
              View all
            </Link>
          </div>
          <div className="recent-list">
            {recent.items.slice(0, 4).map((a) => (
              <Link
                className="recent-item"
                key={a.slug}
                href={"/articles/" + a.slug}
              >
                <div className="recent-image">
                  <Image src={a.featuredImage} alt="" fill sizes="110px" />
                </div>
                <div>
                  <h3 lang={a.language}>{a.title}</h3>
                  <span className="article-meta">
                    {formatDate(a.publishedAt)} · {a.readingTime} min read
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {!recent.items.length && (
            <p className="empty-state">No published articles yet.</p>
          )}
        </section>
        <section>
          <div className="section-heading">
            <h2>Popular articles</h2>
            <Link className="text-link" href="/articles">
              Explore
            </Link>
          </div>
          <div className="popular-grid">
            {popular.items.map((a) => (
              <Link
                className="popular-card"
                key={a.slug}
                href={"/articles/" + a.slug}
              >
                <BookOpen size={22} />
                <h3 lang={a.language}>{a.title}</h3>
                <span className="article-meta">
                  {a.viewCount ?? 0} views · {a.readingTime} min read
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <div className="section-heading">
            <h2>From the scholars</h2>
            <Link className="text-link" href="/quotes">
              View all
            </Link>
          </div>
          <div className="quote-card">
            <span className="quote-mark" aria-hidden="true">
              “
            </span>
            <div>
              {quote ? (
                <>
                  <blockquote>{quote.quote}</blockquote>
                  <p>— {quote.scholar}</p>
                  <small>{quote.source}</small>
                  {quote.sourceUrl && (
                    <p>
                      <a
                        className="text-link"
                        href={quote.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source
                      </a>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3>Carefully sourced. Thoughtfully shared.</h3>
                  <p>
                    Reviewed quotations will appear here once published by our
                    editors.
                  </p>
                  <small>Editorial note — not a scholar quotation.</small>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
      <section id="newsletter" className="newsletter-band">
        <Mail size={30} strokeWidth={1.2} />
        <div>
          <h2>{homepage.newsletterHeading}</h2>
          <p>{homepage.newsletterText}</p>
        </div>
        <NewsletterForm />
      </section>
    </div>
  );
}
