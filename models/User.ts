import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["super-admin", "admin", "editor", "author", "user"],
      default: "user",
      index: true
    },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    avatar: String,
    bio: String,
    notificationPreferences: {
      newsletter: { type: Boolean, default: true },
      courseUpdates: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
