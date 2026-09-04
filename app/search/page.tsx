import type { Metadata } from "next";
import Link from "next/link";
import { listArticles, getTaxonomies } from "@/lib/blog";
export const metadata: Metadata = { title: "Search", robots: { index: false } };
export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q: query = "", page } = await searchParams;
  const q = query.trim().slice(0, 120);
  const [articles, categories, tags] = await Promise.all([
    listArticles({ q, page }),
    getTaxonomies("category", q),
    getTaxonomies("tag", q)
  ]);
  return (
    <div className="container content-shell">
      <div className="content-header">
        <h1>Search the blog</h1>
        <p>Find articles, categories, and tags in Bangla or English.</p>
      </div>
      <form className="search-form">
        <input
          name="q"
          defaultValue={q}
          maxLength={120}
          placeholder="What would you like to read?"
          aria-label="Search query"
        />
        <button className="button button-green">Search</button>
      </form>
      {q ? (
        <>
          <h2>Articles ({articles.total})</h2>
          <div className="search-results">
            {articles.items.map((a) => (
              <Link
                className="search-result"
                lang={a.language}
                href={"/articles/" + a.slug}
                key={a.slug}
              >
                <h2>{a.title}</h2>
                <p>{a.excerpt}</p>
              </Link>
            ))}
          </div>
          {!articles.total && <p>No matching articles.</p>}
          <nav
            className="action-row"
            aria-label="Search pages"
            style={{ marginTop: 20 }}
          >
            {articles.page > 1 && (
              <Link
                className="text-link"
                href={
                  "/search?" +
                  new URLSearchParams({ q, page: String(articles.page - 1) })
                }
              >
                Previous
              </Link>
            )}
            {articles.page < articles.pages && (
              <Link
                className="text-link"
                href={
                  "/search?" +
                  new URLSearchParams({ q, page: String(articles.page + 1) })
                }
              >
                Next
              </Link>
            )}
          </nav>
          <h2>Categories</h2>
          <div className="tag-list">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={"/articles?category=" + encodeURIComponent(c.name)}
              >
                {c.name}
              </Link>
            ))}
          </div>
          {!categories.length && <p>No matching categories.</p>}
          <h2>Tags</h2>
          <div className="tag-list">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={"/articles?tag=" + encodeURIComponent(t.name)}
              >
                {t.name}
              </Link>
            ))}
          </div>
          {!tags.length && <p>No matching tags.</p>}
        </>
      ) : (
        <p className="empty-state">Enter a topic or a phrase to begin.</p>
      )}
    </div>
  );
}
