import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User";

async function main() {
  loadEnvConfig(process.cwd());
  const uri = process.env.MONGODB_URI;
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (
    !uri ||
    !email ||
    !password ||
    password.length < 12 ||
    Buffer.byteLength(password) > 72
  ) {
    throw new Error(
      "Set MONGODB_URI, SUPER_ADMIN_EMAIL, and a strong 12+ character SUPER_ADMIN_PASSWORD (max 72 UTF-8 bytes)."
    );
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  if (await User.exists({ email }))
    throw new Error(
      "That account already exists. No password or role was changed."
    );
  await User.create({
    name: "Administrator",
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "super-admin",
    status: "active"
  });
  console.info(
    "Administrator created. Remove SUPER_ADMIN_PASSWORD from deployment environment settings after use."
  );
}
main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Unable to create administrator."
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
