import Link from "next/link";
import { getTaxonomies } from "@/lib/blog";
export async function TaxonomyPage({ type }: { type: "category" | "tag" }) {
  const items = await getTaxonomies(type);
  return (
    <div className="container content-shell">
      <div className="content-header">
        <h1>{type === "category" ? "Categories" : "Tags"}</h1>
        <p>Follow your curiosity. Find a subject to explore.</p>
      </div>
      {items.length ? (
        <div className="resource-grid">
          {items.map((t) => (
            <Link
              key={t.id}
              className="resource-card"
              href={"/articles?" + type + "=" + encodeURIComponent(t.name)}
            >
              <h2>{t.name}</h2>
              <p>{t.description || "Browse articles on this topic."}</p>
              <span className="text-link">Read articles</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          Topics will appear here when added by the editor.
        </p>
      )}
    </div>
  );
}
