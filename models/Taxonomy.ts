import { Schema, model, models } from "mongoose";
const TaxonomySchema = new Schema(
  {
    type: {
      type: String,
      enum: ["category", "tag"],
      required: true,
      index: true
    },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: String
  },
  { timestamps: true }
);
TaxonomySchema.index({ type: 1, slug: 1 }, { unique: true });
export const Taxonomy = models.Taxonomy || model("Taxonomy", TaxonomySchema);
