import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { listArticles, getTaxonomies } from "@/lib/blog";
export const metadata: Metadata = {
  title: "Articles",
  description: "Thoughtful Islamic articles in Bangla and English."
};
export default async function ArticlesPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    page?: string;
    author?: string;
  }>;
}) {
  const filters = await searchParams;
  const result = await listArticles(filters);
  const categories = await getTaxonomies("category");
  const pageLink = (page: number) =>
    "/articles?" +
    new URLSearchParams({ ...filters, page: String(page) }).toString();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">Home / Articles</div>
          <h1>Articles & reflections</h1>
          <p>A little time to read. A little room to reflect.</p>
        </div>
      </section>
      <section className="content-shell container">
        <form className="search-form">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search in Bangla or English"
            aria-label="Search articles"
          />
          {filters.tag && (
            <input type="hidden" name="tag" value={filters.tag} />
          )}
          {filters.author && (
            <input type="hidden" name="author" value={filters.author} />
          )}
          <select
            name="category"
            aria-label="Category"
            defaultValue={filters.category ?? ""}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="button button-green">Search</button>
          <Link className="button button-outline" href="/articles">
            Clear
          </Link>
        </form>
        {result.demo && (
          <p className="notice">
            Demo preview. Connect MongoDB to publish and save real content.
          </p>
        )}
        {filters.tag && <p>Tagged: {filters.tag}</p>}
        {filters.author && <p>Articles by this author</p>}
        {result.items.length ? (
          <div className="article-grid">
            {result.items.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No articles found. Try another search or clear the filters.
          </div>
        )}
        <nav
          className="action-row"
          aria-label="Pagination"
          style={{ marginTop: 25 }}
        >
          {result.page > 1 && (
            <Link
              className="button button-outline"
              href={pageLink(result.page - 1)}
            >
              Previous
            </Link>
          )}
          {result.pages > 1 && (
            <span>
              Page {result.page} of {result.pages}
            </span>
          )}
          {result.page < result.pages && (
            <Link
              className="button button-outline"
              href={pageLink(result.page + 1)}
            >
              Next
            </Link>
          )}
        </nav>
      </section>
    </>
  );
}
