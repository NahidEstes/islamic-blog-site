import { Schema, model, models } from "mongoose";

const ArticleSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true, maxlength: 400 },
    content: { type: String, required: true },
    contentFormat: {
      type: String,
      enum: ["plain", "rich-html"],
      default: "plain",
      index: true
    },
    searchText: { type: String, default: "" },
    featuredImage: String,
    locale: { type: String, enum: ["en", "bn"], default: "en" },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    category: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true
    },
    featured: { type: Boolean, default: false, index: true },
    seoTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    readingTime: { type: Number, default: 1 },
    viewCount: { type: Number, default: 0 },
    publishedAt: Date,
    archivedAt: Date
  },
  { timestamps: true }
);
ArticleSchema.index({ title: "text", excerpt: "text", content: "text" });

export const Article = models.Article || model("Article", ArticleSchema);
