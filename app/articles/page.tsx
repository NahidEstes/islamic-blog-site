import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, Search } from "lucide-react";
import {
  CompactArticleCard,
  LeadArticleCard,
  PopularArticles,
  SecondaryArticleCard,
  TopicDirectory
} from "@/components/articles/ArticleDirectoryCards";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import {
  articlesUrl,
  paginationRange,
  parseArticleDirectoryQuery,
  splitEditorialArticles
} from "@/lib/article-directory";
import {
  getCategoryDirectory,
  getPopularArticles,
  listArticles
} from "@/lib/blog";
import type { ArticleCardData } from "@/types";

export const metadata: Metadata = {
  title: "Articles & reflections",
  description: "Thoughtful Islamic articles in Bangla and English."
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ArticlesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = parseArticleDirectoryQuery(await searchParams);
  let result: {
    items: ArticleCardData[];
    total: number;
    page: number;
    pages: number;
    demo: boolean;
  } = { items: [], total: 0, page: query.page, pages: 0, demo: false };
  let popular: ArticleCardData[] = [];
  let categories: Awaited<ReturnType<typeof getCategoryDirectory>> = [];
  let loadError = false;

  try {
    [result, popular, categories] = await Promise.all([
      listArticles({ ...query, page: String(query.page), limit: 9 }),
      getPopularArticles(3),
      getCategoryDirectory(100)
    ]);
  } catch (error) {
    loadError = true;
    console.error("Unable to load the article directory", error);
  }

  const editorial = splitEditorialArticles(result.items);
  const pages = paginationRange(result.page, result.pages);

  return (
    <div className="articles-directory">
      <section className="directory-hero">
        <div className="container directory-hero-inner">
          <div>
            <div className="breadcrumbs">
              <Link href="/">Home</Link> / Articles
            </div>
            <h1>Articles &amp; reflections</h1>
            <p>A little time to read. A little room to reflect.</p>
          </div>
          <p className="directory-result-count">
            {loadError
              ? "Article count unavailable"
              : `${result.total} published ${result.total === 1 ? "article" : "articles"}`}
          </p>
          <span className="directory-hero-pattern" aria-hidden="true" />
        </div>
      </section>

      <div className="container directory-content">
        <form className="directory-filters" action="/articles">
          <label className="directory-search-field">
            <span className="sr-only">Search articles</span>
            <Search aria-hidden="true" size={19} />
            <input
              name="q"
              defaultValue={query.q}
              placeholder="Search in Bangla or English"
            />
          </label>
          <label>
            <span className="sr-only">Category</span>
            <select name="category" defaultValue={query.category}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Language</span>
            <select name="locale" defaultValue={query.locale}>
              <option value="">All languages</option>
              <option value="en">English</option>
              <option value="bn">Bangla</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort articles</span>
            <select name="sort" defaultValue={query.sort}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most-read">Most read</option>
              <option value="most-liked">Most liked</option>
            </select>
          </label>
          {query.tag && <input type="hidden" name="tag" value={query.tag} />}
          {query.author && (
            <input type="hidden" name="author" value={query.author} />
          )}
          <button className="button button-green" type="submit">
            Search
          </button>
        </form>

        <nav className="directory-category-nav" aria-label="Article categories">
          <Link
            href={articlesUrl(query, { category: "", page: 1 })}
            aria-current={!query.category ? "page" : undefined}
          >
            All
          </Link>
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={articlesUrl(query, { category: category.name, page: 1 })}
              aria-current={
                query.category === category.name ? "page" : undefined
              }
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {result.demo && (
          <p className="notice">
            Demo preview. Connect MongoDB to publish and manage real content.
          </p>
        )}
        {(query.tag || query.author) && (
          <div className="directory-active-filter">
            <span>
              {query.tag
                ? `Tag: ${query.tag}`
                : "Showing articles by this author"}
            </span>
            <Link href="/articles">Clear filters</Link>
          </div>
        )}

        {loadError ? (
          <div className="error-state" role="alert">
            Articles could not be loaded right now. Please try again shortly.
          </div>
        ) : editorial.lead ? (
          <>
            <section aria-labelledby="latest-heading">
              <div className="directory-section-heading">
                <h2 id="latest-heading">Latest reflections</h2>
                <Link href={articlesUrl(query, { page: 1 })}>
                  View all articles <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </div>
              <div className="directory-editorial-grid">
                <LeadArticleCard article={editorial.lead} />
                <div className="directory-secondary-grid">
                  {editorial.secondary.map((article) => (
                    <SecondaryArticleCard
                      key={article.slug}
                      article={article}
                    />
                  ))}
                </div>
              </div>
            </section>

            {editorial.more.length > 0 && (
              <section
                className="directory-more"
                aria-labelledby="more-heading"
              >
                <div className="directory-section-heading">
                  <h2 id="more-heading">More to explore</h2>
                </div>
                <div className="directory-more-grid">
                  {editorial.more.map((article) => (
                    <CompactArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h2>No articles found</h2>
            <p>Try a different search, category, or language.</p>
            <Link className="button button-outline" href="/articles">
              Clear all filters
            </Link>
          </div>
        )}

        {!loadError && <PopularArticles articles={popular} />}
        {!loadError && <TopicDirectory categories={categories.slice(0, 6)} />}

        <section
          className="newsletter-band"
          aria-labelledby="directory-newsletter"
        >
          <Mail aria-hidden="true" size={30} />
          <div>
            <h2 id="directory-newsletter">A quiet note for your inbox</h2>
            <p>
              Thoughtful articles, new reflections, and useful resources —
              delivered with care.
            </p>
          </div>
          <NewsletterForm />
        </section>

        {result.pages > 1 && (
          <nav className="directory-pagination" aria-label="Article pagination">
            {result.page > 1 ? (
              <Link href={articlesUrl(query, { page: result.page - 1 })}>
                <ArrowLeft aria-hidden="true" size={15} /> Previous
              </Link>
            ) : (
              <span aria-disabled="true">
                <ArrowLeft aria-hidden="true" size={15} /> Previous
              </span>
            )}
            {pages.map((page) => (
              <Link
                key={page}
                href={articlesUrl(query, { page })}
                aria-current={page === result.page ? "page" : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </Link>
            ))}
            {result.page < result.pages ? (
              <Link href={articlesUrl(query, { page: result.page + 1 })}>
                Next <ArrowRight aria-hidden="true" size={15} />
              </Link>
            ) : (
              <span aria-disabled="true">
                Next <ArrowRight aria-hidden="true" size={15} />
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
