import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/blog";
import { pageNumber } from "@/lib/utils";
import { Article } from "@/models/Article";
import { Quote } from "@/models/Quote";
import { Comment } from "@/models/Interaction";
import { Taxonomy } from "@/models/Taxonomy";
import { User } from "@/models/User";
import { ContactMessage, NewsletterSubscriber } from "@/models/Communication";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { QuoteEditor } from "@/components/admin/QuoteEditor";
import { RecordActions } from "@/components/admin/RecordActions";
import { LearnCategoryManager } from "@/components/admin/LearnCategoryManager";
import { Dua, LearnCategory } from "@/models/Learn";
const titles: Record<string, string> = {
  articles: "Articles",
  learn: "Learn Categories",
  duas: "Duas",
  categories: "Categories",
  tags: "Tags",
  quotes: "Quotes",
  comments: "Comments",
  users: "Users",
  newsletter: "Newsletter",
  messages: "Contact Messages",
  homepage: "Homepage",
  settings: "Site Settings"
};
export default async function AdminSection({
  params,
  searchParams
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await getSession();
  if (!user || !isAdmin(user.role)) redirect("/login");
  const { section } = await params;
  if (!titles[section]) notFound();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const pageSize = 20;
  await connectToDatabase();
  if (section === "learn") {
    const categories = await LearnCategory.find()
      .sort({ module: 1, order: 1, name: 1 })
      .lean();
    return (
      <>
        <div className="admin-title">
          <div>
            <h1>Learn Categories</h1>
            <p>
              Simple shared categories for current and future learning modules.
            </p>
          </div>
        </div>
        <details className="panel" style={{ marginBottom: 24 }}>
          <summary>Create learning category</summary>
          <LearnCategoryManager />
        </details>
        <div className="search-results">
          {categories.map((category) => (
            <section className="panel" key={String(category._id)}>
              <h2>{category.name}</h2>
              <p className="small-note">
                {category.module} ·{" "}
                {category.published ? "published" : "hidden"} · order{" "}
                {category.order}
              </p>
              <LearnCategoryManager
                initial={JSON.parse(JSON.stringify(category))}
              />
            </section>
          ))}
        </div>
        {!categories.length && (
          <p className="empty-state">
            No managed learning categories yet. The public Duas page uses its
            basic topic labels until you add these.
          </p>
        )}
      </>
    );
  }
  if (section === "settings" || section === "homepage") {
    const settings = await getSettings();
    return (
      <>
        <div className="admin-title">
          <h1>{titles[section]}</h1>
        </div>
        <SettingsEditor
          settingKey={section === "settings" ? "site" : "homepage"}
          initialValue={
            section === "settings" ? settings.site : settings.homepage
          }
        />
      </>
    );
  }
  const statusOptions =
    section === "articles" || section === "duas"
      ? ["draft", "published", "archived"]
      : section === "comments"
        ? ["pending", "approved", "hidden"]
        : null;
  const status = statusOptions?.includes(query.status ?? "")
    ? query.status
    : undefined;
  const filter =
    section === "categories" || section === "tags"
      ? { type: section === "categories" ? "category" : "tag" }
      : status
        ? { status }
        : {};
  const model =
    section === "articles"
      ? Article
      : section === "duas"
        ? Dua
        : section === "quotes"
          ? Quote
          : section === "comments"
            ? Comment
            : section === "categories" || section === "tags"
              ? Taxonomy
              : section === "users"
                ? User
                : section === "messages"
                  ? ContactMessage
                  : NewsletterSubscriber;
  const total = await model.countDocuments(filter);
  let rowQuery = model
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  if (section === "users")
    rowQuery = rowQuery.select("name email role status createdAt");
  if (section === "comments")
    rowQuery = rowQuery
      .populate("user", "name email")
      .populate("article", "title slug status");
  const rows = await rowQuery.lean();
  const pages = Math.ceil(total / pageSize);
  const pagination = (
    <nav
      className="action-row"
      aria-label="Admin pages"
      style={{ marginTop: 22 }}
    >
      {page > 1 && (
        <Link
          className="button button-outline"
          href={
            "?" +
            new URLSearchParams({
              page: String(page - 1),
              ...(status ? { status } : {})
            })
          }
        >
          Previous
        </Link>
      )}
      <span className="small-note">
        {total} records · Page {page} of {Math.max(1, pages)}
      </span>
      {page < pages && (
        <Link
          className="button button-outline"
          href={
            "?" +
            new URLSearchParams({
              page: String(page + 1),
              ...(status ? { status } : {})
            })
          }
        >
          Next
        </Link>
      )}
    </nav>
  );
  return (
    <>
      <div className="admin-title">
        <h1>{titles[section]}</h1>
        {section === "articles" && (
          <Link className="button button-green" href="/admin/articles/new">
            Create article
          </Link>
        )}
        {section === "duas" && (
          <Link className="button button-green" href="/admin/duas/new">
            Create Dua
          </Link>
        )}
      </div>
      {statusOptions && (
        <form className="search-form">
          <select
            aria-label="Filter status"
            name="status"
            defaultValue={status ?? ""}
          >
            <option value="">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="button button-outline">Filter</button>
        </form>
      )}
      {section === "quotes" && (
        <>
          <p className="notice">
            Use exact wording from a reliable source. Do not generate or invent
            quotations. Published entries must be verified.
          </p>
          <details className="panel" style={{ marginBottom: 24 }}>
            <summary>Create quote</summary>
            <QuoteEditor />
          </details>
        </>
      )}
      {(section === "categories" || section === "tags") && (
        <details className="panel" style={{ marginBottom: 24 }}>
          <summary>Create {section === "tags" ? "tag" : "category"}</summary>
          <TaxonomyManager type={section === "tags" ? "tag" : "category"} />
        </details>
      )}
      {!rows.length && <p className="empty-state">No records found.</p>}
      <div className="search-results">
        {rows.map((row) => {
          const id = String(row._id);
          if (section === "quotes")
            return (
              <section className="panel" key={id}>
                <h2>{row.scholar}</h2>
                <p>{row.quote}</p>
                <p className="small-note">
                  {row.published ? "Published" : "Draft"} · {row.source}
                </p>
                <details>
                  <summary>Edit quotation</summary>
                  <QuoteEditor initial={JSON.parse(JSON.stringify(row))} />
                </details>
                <RecordActions endpoint={"/api/admin/quotes/" + id} />
              </section>
            );
          if (section === "categories" || section === "tags")
            return (
              <section className="panel" key={id}>
                <h2>{row.name}</h2>
                <p>{row.description}</p>
                <details>
                  <summary>Edit topic</summary>
                  <TaxonomyManager
                    type={section === "tags" ? "tag" : "category"}
                    initial={{
                      _id: id,
                      name: row.name,
                      description: row.description ?? ""
                    }}
                  />
                </details>
                <RecordActions endpoint={"/api/admin/taxonomies/" + id} />
              </section>
            );
          if (section === "articles")
            return (
              <section className="panel" key={id}>
                <h2>
                  <Link href={"/admin/articles/" + id + "/edit"}>
                    {row.title}
                  </Link>
                </h2>
                <p className="small-note">
                  {row.category} · {row.status} ·{" "}
                  {row.locale === "bn" ? "Bangla" : "English"}
                </p>
                <div className="action-row">
                  <Link
                    className="button button-outline"
                    href={"/admin/articles/" + id + "/edit"}
                  >
                    Edit article
                  </Link>
                  {row.status === "published" && (
                    <Link
                      className="button button-outline"
                      href={"/articles/" + row.slug}
                    >
                      Read
                    </Link>
                  )}
                  <RecordActions
                    endpoint={"/api/articles/" + id}
                    status={row.status}
                    statuses={["draft", "published", "archived"]}
                  />
                </div>
              </section>
            );
          if (section === "duas")
            return (
              <section className="panel" key={id}>
                <h2>{row.title}</h2>
                <p className="small-note">
                  {row.category} · {row.status} ·{" "}
                  {row.verified ? "verified" : "not verified"}
                </p>
                <div className="action-row">
                  <Link
                    className="button button-outline"
                    href={"/admin/duas/" + id + "/edit"}
                  >
                    Edit Dua
                  </Link>
                  <Link
                    className="button button-outline"
                    href={"/admin/duas/" + id + "/preview"}
                  >
                    Preview
                  </Link>
                  {row.status === "published" && row.verified && (
                    <Link
                      className="button button-outline"
                      href={"/learn/duas/" + encodeURIComponent(row.slug)}
                    >
                      Open public page
                    </Link>
                  )}
                  <RecordActions
                    endpoint={"/api/admin/duas/" + id}
                    allowDelete
                  />
                </div>
              </section>
            );
          if (section === "comments")
            return (
              <section className="panel" key={id}>
                <h3>
                  {row.user?.name ?? "Reader"} <small>· {row.status}</small>
                </h3>
                <p className="small-note">
                  Article: {row.article?.title ?? "Removed article"}
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>{row.body}</p>
                <RecordActions
                  endpoint={"/api/admin/comments/" + id}
                  status={row.status}
                  statuses={["pending", "approved", "hidden"]}
                />
              </section>
            );
          if (section === "users")
            return (
              <section className="panel" key={id}>
                <h3>{row.name}</h3>
                <p>{row.email}</p>
                <p className="small-note">
                  {row.role} · {row.status}
                </p>
                {id !== user.id ? (
                  <RecordActions
                    endpoint={"/api/admin/users/" + id}
                    status={row.status}
                    statuses={["active", "suspended"]}
                    role={row.role}
                    roles={
                      user.role === "super-admin"
                        ? ["user", "author", "editor", "admin", "super-admin"]
                        : [row.role]
                    }
                    allowDelete={false}
                  />
                ) : (
                  <p className="small-note">
                    Your account — access changes are disabled.
                  </p>
                )}
              </section>
            );
          if (section === "messages")
            return (
              <section className="panel" key={id}>
                <h3>{row.subject}</h3>
                <p className="small-note">
                  {row.name} · <a href={"mailto:" + row.email}>{row.email}</a>
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>{row.message}</p>
                <RecordActions
                  endpoint={"/api/admin/messages/" + id}
                  status={row.status}
                  statuses={["unread", "read", "archived"]}
                />
              </section>
            );
          return (
            <section className="panel" key={id}>
              <h3>{row.email}</h3>
              <p className="small-note">
                {row.status} ·{" "}
                {new Date(row.subscribedAt ?? row.createdAt).toLocaleDateString(
                  "en"
                )}
              </p>
              <RecordActions
                endpoint={"/api/admin/newsletter/" + id}
                status={row.status}
                statuses={["active", "unsubscribed"]}
              />
            </section>
          );
        })}
      </div>
      {pagination}
    </>
  );
}
