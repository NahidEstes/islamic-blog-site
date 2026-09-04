import { Schema, model, models } from "mongoose";

const LessonSchema = new Schema({
  title: { type: String, required: true },
  content: String,
  videoUrl: String,
  audioUrl: String,
  resources: [String],
  order: { type: Number, required: true }
});
const CourseSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    instructor: String,
    thumbnail: String,
    category: String,
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"]
    },
    lessons: [LessonSchema],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true
    },
    featured: { type: Boolean, default: false },
    isPaid: { type: Boolean, default: false },
    duration: String
  },
  { timestamps: true }
);
export const Course = models.Course || model("Course", CourseSchema);
