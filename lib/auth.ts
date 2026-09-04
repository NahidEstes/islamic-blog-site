import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser, UserRole } from "@/types";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

const COOKIE_NAME = "noor_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === "production")
      throw new Error("AUTH_SECRET must contain at least 32 characters.");
    return new TextEncoder().encode(
      "development-only-secret-change-before-production"
    );
  }
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.id !== "string" || !/^[a-f0-9]{24}$/i.test(payload.id))
      return null;
    await connectToDatabase();
    const user = await User.findOne({ _id: payload.id, status: "active" })
      .select("name email role")
      .lean();
    return user
      ? {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role
        }
      : null;
  } catch {
    return null;
  }
}

export function canManageContent(role: UserRole) {
  return ["super-admin", "admin", "editor", "author"].includes(role);
}

export function isAdmin(role: UserRole) {
  return ["super-admin", "admin"].includes(role);
}
