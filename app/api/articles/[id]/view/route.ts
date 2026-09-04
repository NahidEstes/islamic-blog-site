import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { apiError, checkedId, HttpError } from "@/lib/api";
import { isAllowed, isTrustedMutation } from "@/lib/request";
import { Article } from "@/models/Article";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isTrustedMutation(request))
      throw new HttpError(403, "Invalid origin.");
    const id = checkedId((await params).id);
    if (!isAllowed(request, "view:" + id, 1, 30 * 60 * 1000))
      return NextResponse.json({ counted: false });
    await connectToDatabase();
    await Article.updateOne(
      { _id: id, status: "published" },
      { $inc: { viewCount: 1 } }
    );
    return NextResponse.json({ counted: true });
  } catch (e) {
    return apiError(e);
  }
}
