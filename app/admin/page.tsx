import Link from "next/link";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { Article } from "@/models/Article";
import { ContactMessage, NewsletterSubscriber } from "@/models/Communication";
import { Comment } from "@/models/Interaction";
import { ActivityLog } from "@/models/Site";
import { User } from "@/models/User";

export default async function AdminDashboard() {
  let stats = {
    users: 0,
    published: 0,
    drafts: 0,
    comments: 0,
    messages: 0,
    subscribers: 0
  };
  let activity: Array<{ _id: string; action: string; createdAt: Date }> = [];
  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const counts = await Promise.all([
      User.countDocuments(),
      Article.countDocuments({ status: "published" }),
      Article.countDocuments({ status: "draft" }),
      Comment.countDocuments(),
      ContactMessage.countDocuments({ status: "unread" }),
      NewsletterSubscriber.countDocuments({ status: "active" })
    ]);
    stats = {
      users: counts[0],
      published: counts[1],
      drafts: counts[2],
      comments: counts[3],
      messages: counts[4],
      subscribers: counts[5]
    };
    activity = await ActivityLog.find().sort({ createdAt: -1 }).limit(8).lean();
  }
  const cards = [
    ["Total users", stats.users],
    ["Published articles", stats.published],
    ["Draft articles", stats.drafts],
    ["Comments", stats.comments],
    ["Unread messages", stats.messages],
    ["Subscribers", stats.subscribers]
  ];
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Dashboard</h1>
          <p>Your publication at a glance.</p>
        </div>
        <Link className="button button-green" href="/admin/articles/new">
          Create article
        </Link>
      </div>
      {!isDatabaseConfigured() && (
        <div className="notice">
          <strong>Setup required:</strong> Add MONGODB_URI and AUTH_SECRET, then
          run npm run seed. The interface remains browsable, but writes are
          disabled.
        </div>
      )}
      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="panel">
        <h2>Recent activity</h2>
        {activity.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item) => (
                <tr key={String(item._id)}>
                  <td>{item.action}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <h2>No activity yet</h2>
            <p>
              Seed the database or begin managing content to populate this log.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
