import { apiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { isAllowed, isTrustedMutation } from "@/lib/request";
import { newsletterSchema } from "@/lib/validation";
import { NewsletterSubscriber } from "@/models/Communication";
export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request))
      return NextResponse.json(
        { message: "Invalid request origin." },
        { status: 403 }
      );
    if (!isAllowed(request, "newsletter", 8))
      return NextResponse.json(
        { message: "Please wait and try again." },
        { status: 429 }
      );
    const parsed = newsletterSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 }
      );
    if (!isDatabaseConfigured())
      return NextResponse.json(
        { message: "Subscription storage needs MONGODB_URI." },
        { status: 503 }
      );
    await connectToDatabase();
    await NewsletterSubscriber.findOneAndUpdate(
      { email: parsed.data.email.toLowerCase() },
      { status: "active", subscribedAt: new Date() },
      { upsert: true }
    );
    return NextResponse.json(
      { message: "You’re subscribed. Welcome." },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
