import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError } from "@/lib/api";
import { quoteSchema } from "@/lib/validation";
import { Quote } from "@/models/Quote";
export async function POST(request: NextRequest) {
  try {
    await authorize(request, true);
    const data = quoteSchema.parse(await request.json());
    const item = await Quote.create(data);
    return NextResponse.json(
      { item, message: "Quote saved." },
      { status: 201 }
    );
  } catch (e) {
    return apiError(e);
  }
}
