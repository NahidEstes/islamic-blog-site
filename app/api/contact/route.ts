import { apiError } from "@/lib/api";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { isAllowed, isTrustedMutation } from "@/lib/request";
import { contactSchema } from "@/lib/validation";
import { ContactMessage } from "@/models/Communication";

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request))
      return NextResponse.json(
        { message: "Invalid request origin." },
        { status: 403 }
      );
    if (!isAllowed(request, "contact", 5, 300_000))
      return NextResponse.json(
        { message: "Please wait before sending another message." },
        { status: 429 }
      );
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    if (!isDatabaseConfigured())
      return NextResponse.json(
        {
          message:
            "The contact form is ready, but message storage needs MONGODB_URI."
        },
        { status: 503 }
      );
    await connectToDatabase();
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    await ContactMessage.create({
      ...parsed.data,
      ipHash: createHash("sha256").update(ip).digest("hex")
    });
    return NextResponse.json(
      { message: "Thank you. Your message has been received." },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
