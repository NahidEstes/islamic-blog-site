import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Bookmark } from "@/models/Site";
import { Article } from "@/models/Article";
import { User } from "@/models/User";
import { toCard } from "@/lib/blog";
import { ArticleCard } from "@/components/ArticleCard";
import { ProfileForm } from "@/components/ProfileForm";
import { RemoveBookmark } from "@/components/RemoveBookmark";
export default async function AccountPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  await connectToDatabase();
  const [profile, bookmarks] = await Promise.all([
    User.findById(user.id).select("bio").lean(),
    Bookmark.find({ user: user.id, contentType: "article" })
      .sort({ createdAt: -1 })
      .lean()
  ]);
  const articles = await Article.find({
    _id: { $in: bookmarks.map((b) => b.contentId) },
    status: "published"
  }).lean();
  const byId = new Map(articles.map((a) => [String(a._id), a]));
  const saved = bookmarks.flatMap((b) => {
    const a = byId.get(String(b.contentId));
    return a ? [toCard(a)] : [];
  });
  return (
    <div className="container content-shell">
      <div className="section-heading">
        <h1>Your profile</h1>
        {isAdmin(user.role) && (
          <Link className="button button-outline" href="/admin">
            Admin dashboard
          </Link>
        )}
      </div>
      <div className="panel" style={{ maxWidth: 650 }}>
        <p>{user.email}</p>
        <ProfileForm name={user.name} bio={String(profile?.bio ?? "")} />
        <form action="/api/auth/logout" method="post" style={{ marginTop: 20 }}>
          <button className="button button-outline">Log out</button>
        </form>
      </div>
      <section className="section">
        <h2>Saved articles</h2>
        <p className="small-note">
          Only currently published articles appear in your saved list.
        </p>
        {saved.length ? (
          <div className="article-grid">
            {saved.map((a) => (
              <div key={a.id}>
                <ArticleCard article={a} />
                <RemoveBookmark id={a.id!} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No saved articles yet.</p>
            <Link className="text-link" href="/articles">
              Find something to read
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
