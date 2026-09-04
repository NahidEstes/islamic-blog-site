import { getQuotes } from "@/lib/blog";
export const metadata = { title: "Scholar quotes" };
export default async function QuotesPage() {
  const quotes = await getQuotes(100);
  return (
    <div className="container content-shell">
      <div className="content-header">
        <h1>From the scholars</h1>
        <p>Source-referenced quotations reviewed by the editorial team.</p>
      </div>
      <div className="search-results">
        {quotes.map((q) => (
          <figure className="quote-card" key={String(q._id)}>
            <span className="quote-mark" aria-hidden="true">
              “
            </span>
            <div>
              <blockquote>{q.quote}</blockquote>
              <figcaption>
                — {q.scholar}
                <p>{q.source}</p>
                {q.sourceUrl && (
                  <a
                    className="text-link"
                    href={q.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View source
                  </a>
                )}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
      {!quotes.length && (
        <p className="empty-state">
          No quotations have been published yet. We never fill this space with
          invented quotations.
        </p>
      )}
    </div>
  );
}
