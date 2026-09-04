import { Schema, model, models } from "mongoose";

const KeyValueSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
const BookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    contentType: { type: String, enum: ["article", "quran", "hadith"] },
    contentId: { type: Schema.Types.ObjectId },
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
);
BookmarkSchema.index(
  { user: 1, contentType: 1, contentId: 1 },
  { unique: true }
);
const ProgressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    completedLessonIds: [Schema.Types.ObjectId],
    percent: { type: Number, min: 0, max: 100, default: 0 }
  },
  { timestamps: true }
);
ProgressSchema.index({ user: 1, course: 1 }, { unique: true });
const ActivitySchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    action: String,
    entityType: String,
    entityId: Schema.Types.ObjectId,
    metadata: Schema.Types.Mixed
  },
  { timestamps: true }
);
export const SiteSetting =
  models.SiteSetting || model("SiteSetting", KeyValueSchema);
export const Bookmark = models.Bookmark || model("Bookmark", BookmarkSchema);
export const CourseProgress =
  models.CourseProgress || model("CourseProgress", ProgressSchema);
export const ActivityLog =
  models.ActivityLog || model("ActivityLog", ActivitySchema);
