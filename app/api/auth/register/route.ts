import { apiError } from "@/lib/api";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { isAllowed, isTrustedMutation } from "@/lib/request";
import { registerSchema } from "@/lib/validation";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request))
      return NextResponse.json(
        { message: "Invalid request origin." },
        { status: 403 }
      );
    if (!isAllowed(request, "register", 5))
      return NextResponse.json(
        { message: "Too many attempts. Please wait a minute." },
        { status: 429 }
      );
    if (!isDatabaseConfigured())
      return NextResponse.json(
        {
          message:
            "Account storage is not configured yet. Add MONGODB_URI to .env.local."
        },
        { status: 503 }
      );
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    await connectToDatabase();
    if (await User.exists({ email: parsed.data.email }))
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: "user"
    });
    const sessionUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role
    };
    await createSession(sessionUser);
    return NextResponse.json({ user: sessionUser }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
