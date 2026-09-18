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
import { DuaProgress } from "@/models/Learn";
import { ArrowRight, Heart } from "lucide-react";
export default async function AccountPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  await connectToDatabase();
  const [profile, bookmarks, duaProgress] = await Promise.all([
    User.findById(user.id).select("bio").lean(),
    Bookmark.find({ user: user.id, contentType: "article" })
      .sort({ createdAt: -1 })
      .lean(),
    DuaProgress.find({
      user: user.id,
      $or: [{ favorite: true }, { status: { $ne: "not-started" } }]
    })
      .sort({ lastAccessedAt: -1 })
      .populate({
        path: "dua",
        match: { status: "published", verified: true },
        select: "title slug category"
      })
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
      <section className="section">
        <h2>Saved duas & learning progress</h2>
        <p className="small-note">
          Open a dua to continue learning or change its saved status.
        </p>
        {duaProgress.some((item) => item.dua) ? (
          <div className="learn-recent-list">
            {duaProgress
              .filter((item) => item.dua)
              .map((item) => {
                const dua = item.dua as unknown as {
                  _id: string;
                  title: string;
                  slug: string;
                  category: string;
                };
                return (
                  <Link
                    href={"/learn/duas/" + encodeURIComponent(dua.slug)}
                    key={String(item._id)}
                  >
                    <span className="learn-list-icon">
                      <Heart size={17} />
                    </span>
                    <span>
                      <strong>{dua.title}</strong>
                      <small>
                        {dua.category} · {String(item.status).replace("-", " ")}
                        {item.favorite ? " · saved" : ""}
                      </small>
                    </span>
                    <ArrowRight size={15} />
                  </Link>
                );
              })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No saved or started duas yet.</p>
            <Link className="text-link" href="/learn/duas">
              Explore duas
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
