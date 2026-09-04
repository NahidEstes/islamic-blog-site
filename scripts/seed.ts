import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { Article } from "../models/Article";
import { User } from "../models/User";
import { Taxonomy } from "../models/Taxonomy";
import { Quote } from "../models/Quote";
import { ArticleLike, Comment } from "../models/Interaction";
import { Bookmark, SiteSetting, ActivityLog } from "../models/Site";
import { ContactMessage, NewsletterSubscriber } from "../models/Communication";
import { demoArticles } from "../data/demo";
import { slugify } from "../lib/utils";
async function main() {
  loadEnvConfig(process.cwd());
  if (process.argv.includes("--reset"))
    throw new Error(
      "Bulk reset is disabled. Use a separate development database; existing records are preserved."
    );
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seeding is disabled in production.");
  const uri = process.env.MONGODB_URI;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!uri) throw new Error("MONGODB_URI is required.");
  if (!password || password.length < 12 || password.length > 72)
    throw new Error("SUPER_ADMIN_PASSWORD must be 12–72 characters.");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const hash = await bcrypt.hash(password, 12);
  // Insert only: rerunning this script never resets passwords or overwrites edited content.
  for (const [email, name, role] of [
    [
      process.env.SUPER_ADMIN_EMAIL ?? "admin@example.com",
      "Site Administrator",
      "super-admin"
    ],
    ["reader@example.com", "Demo Reader", "user"]
  ]) {
    await User.updateOne(
      { email },
      { $setOnInsert: { name, role, status: "active", passwordHash: hash } },
      { upsert: true }
    );
  }
  const admin = await User.findOne({
    email: process.env.SUPER_ADMIN_EMAIL ?? "admin@example.com"
  });
  const reader = await User.findOne({ email: "reader@example.com" });
  for (const name of [
    "Faith",
    "Knowledge",
    "Seerah",
    "Character",
    "Reflection",
    "Everyday life"
  ])
    await Taxonomy.updateOne(
      { type: "category", slug: slugify(name) },
      {
        $setOnInsert: {
          name,
          description: "Articles on " + name.toLowerCase() + "."
        }
      },
      { upsert: true }
    );
  for (const name of ["Learning", "Habits", "Sources", "পাঠাভ্যাস"])
    await Taxonomy.updateOne(
      { type: "tag", slug: slugify(name) },
      { $setOnInsert: { name } },
      { upsert: true }
    );
  for (const demo of demoArticles) {
    const { language, ...article } = demo;
    await Article.updateOne(
      { slug: demo.slug },
      {
        $setOnInsert: {
          ...article,
          locale: language,
          author: admin._id,
          status: "published"
        }
      },
      { upsert: true }
    );
  }
  await Article.updateOne(
    { slug: "demo-editorial-draft" },
    {
      $setOnInsert: {
        title: "Demo editorial draft",
        excerpt:
          "An unpublished record for testing the simple editorial workflow.",
        content:
          "This development draft contains no religious quotations. It is intended only for testing editing, publishing, archiving, and deletion.",
        author: admin._id,
        category: "Knowledge",
        tags: ["Learning"],
        locale: "en",
        status: "draft"
      }
    },
    { upsert: true }
  );
  const first = await Article.findOne({ slug: demoArticles[0].slug });
  await Bookmark.updateOne(
    { user: reader._id, contentType: "article", contentId: first._id },
    { $setOnInsert: { metadata: { title: first.title } } },
    { upsert: true }
  );
  await ArticleLike.updateOne(
    { user: reader._id, article: first._id },
    { $setOnInsert: { user: reader._id, article: first._id } },
    { upsert: true }
  );
  for (const [body, status] of [
    ["Demo comment: this reading layout is easy to follow.", "approved"],
    ["নমুনা মন্তব্য: নিয়মিত পড়ার অভ্যাস গড়ে তোলার অনুশীলন করছি।", "pending"]
  ])
    await Comment.updateOne(
      { user: reader._id, article: first._id, body },
      { $setOnInsert: { status } },
      { upsert: true }
    );
  await Quote.updateOne(
    { isDemo: true },
    {
      $setOnInsert: {
        quote:
          "Development placeholder only. Replace with a genuine, checked quotation in a new entry.",
        scholar: "Demo entry — not a scholar quotation",
        source: "No source supplied; editorial verification required.",
        sourceUrl: "",
        published: false,
        featured: false,
        verified: false
      }
    },
    { upsert: true }
  );
  for (const email of ["reader@example.com", "subscriber@example.com"])
    await NewsletterSubscriber.updateOne(
      { email },
      { $setOnInsert: { status: "active" } },
      { upsert: true }
    );
  await ContactMessage.updateOne(
    { email: "demo-contact@example.com", subject: "Demo feedback" },
    {
      $setOnInsert: {
        name: "Demo Reader",
        message:
          "This is a development message for testing the editorial inbox.",
        status: "unread"
      }
    },
    { upsert: true }
  );
  const settings = {
    site: {
      name: "Noor Al-Hidayah",
      description: "Thoughtful Islamic articles in Bangla and English.",
      contactEmail: "",
      footerText:
        "A quiet space for thoughtful Islamic reading. Learn carefully. Reflect deeply."
    },
    homepage: {
      introHeading: "Assalamu alaikum wa rahmatullah.",
      introText:
        "Thoughtful reading for a life rooted in faith. Explore ideas, nurture understanding, and grow in knowledge.",
      newsletterHeading: "A little knowledge, in your inbox.",
      newsletterText: "New articles and thoughtful reading. No clutter.",
      featuredSlug: ""
    }
  };
  for (const [key, value] of Object.entries(settings))
    await SiteSetting.updateOne(
      { key },
      { $setOnInsert: { value } },
      { upsert: true }
    );
  await ActivityLog.updateOne(
    { action: "development.blog-seeded" },
    { $setOnInsert: { actor: admin._id, entityType: "SeedData" } },
    { upsert: true }
  );
  console.info(
    "Safe blog seed complete. Existing records and passwords were preserved. Demo quotes remain unpublished."
  );
  await mongoose.disconnect();
}
main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
