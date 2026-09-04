import { apiError } from "@/lib/api";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { isAllowed, isTrustedMutation } from "@/lib/request";
import { loginSchema } from "@/lib/validation";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request))
      return NextResponse.json(
        { message: "Invalid request origin." },
        { status: 403 }
      );
    if (!isAllowed(request, "login", 10))
      return NextResponse.json(
        { message: "Too many attempts. Please wait a minute." },
        { status: 429 }
      );
    if (!isDatabaseConfigured())
      return NextResponse.json(
        {
          message:
            "Authentication is ready but MongoDB is not configured. See .env.example."
        },
        { status: 503 }
      );
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 400 }
      );
    await connectToDatabase();
    const user = await User.findOne({
      email: parsed.data.email,
      status: "active"
    }).select("+passwordHash");
    if (
      !user ||
      !(await bcrypt.compare(parsed.data.password, user.passwordHash))
    )
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    const sessionUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role
    };
    await createSession(sessionUser);
    return NextResponse.json({ user: sessionUser });
  } catch (error) {
    return apiError(error);
  }
}
