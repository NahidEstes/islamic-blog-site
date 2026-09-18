import { Schema, model, models } from "mongoose";

const MeaningSegmentSchema = new Schema(
  {
    arabicPhrase: { type: String, required: true, trim: true, maxlength: 500 },
    transliteration: { type: String, trim: true, maxlength: 500 },
    banglaMeaning: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    order: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const DuaSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, index: true },
    arabicText: { type: String, required: true, trim: true, maxlength: 10000 },
    banglaMeaning: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000
    },
    transliteration: { type: String, trim: true, maxlength: 10000 },
    category: { type: String, required: true, trim: true, index: true },
    source: { type: String, required: true, trim: true, maxlength: 500 },
    reference: { type: String, required: true, trim: true, maxlength: 500 },
    sourceUrl: { type: String, trim: true, maxlength: 1000 },
    audioUrl: { type: String, trim: true, maxlength: 1000 },
    segments: {
      type: [MeaningSegmentSchema],
      validate: {
        validator: (items: Array<{ order: number }>) =>
          items.length <= 100 &&
          new Set(items.map((item) => item.order)).size === items.length,
        message: "Segment order values must be unique."
      },
      default: []
    },
    featured: { type: Boolean, default: false, index: true },
    verified: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: Date,
    archivedAt: Date
  },
  { timestamps: true }
);

const LearnCategorySchema = new Schema(
  {
    module: {
      type: String,
      enum: [
        "duas",
        "quran",
        "hadith",
        "arabic-stories",
        "vocabulary",
        "practice"
      ],
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300 },
    order: { type: Number, min: 0, max: 10000, default: 0 },
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);
LearnCategorySchema.index({ module: 1, slug: 1 }, { unique: true });

const DuaProgressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dua: { type: Schema.Types.ObjectId, ref: "Dua", required: true },
    currentStep: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "not-started",
      index: true
    },
    favorite: { type: Boolean, default: false, index: true },
    startedAt: Date,
    completedAt: Date,
    lastAccessedAt: Date
  },
  { timestamps: true }
);
DuaProgressSchema.index({ user: 1, dua: 1 }, { unique: true });

export const Dua = models.Dua || model("Dua", DuaSchema);
export const LearnCategory =
  models.LearnCategory || model("LearnCategory", LearnCategorySchema);
export const DuaProgress =
  models.DuaProgress || model("DuaProgress", DuaProgressSchema);
