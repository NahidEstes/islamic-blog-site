import { Schema, model, models } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    name: String,
    email: { type: String, index: true },
    subject: String,
    message: String,
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
      index: true
    },
    ipHash: String
  },
  { timestamps: true }
);
const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active"
    },
    subscribedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
export const ContactMessage =
  models.ContactMessage || model("ContactMessage", ContactMessageSchema);
export const NewsletterSubscriber =
  models.NewsletterSubscriber ||
  model("NewsletterSubscriber", SubscriberSchema);
