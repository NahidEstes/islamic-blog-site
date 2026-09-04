import { Schema, model, models } from "mongoose";
const ArticleLikeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    article: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);
ArticleLikeSchema.index({ user: 1, article: 1 }, { unique: true });
const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    article: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
      index: true
    },
    body: { type: String, required: true, maxlength: 3000 },
    status: {
      type: String,
      enum: ["pending", "approved", "hidden"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);
export const ArticleLike =
  models.ArticleLike || model("ArticleLike", ArticleLikeSchema);
export const Comment = models.Comment || model("Comment", CommentSchema);
