import { Schema, model, models } from "mongoose";
const QuoteSchema = new Schema(
  {
    quote: { type: String, required: true, maxlength: 3000 },
    scholar: { type: String, required: true, maxlength: 150 },
    source: { type: String, required: true, maxlength: 500 },
    sourceUrl: String,
    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false }
  },
  { timestamps: true }
);
export const Quote = models.Quote || model("Quote", QuoteSchema);
