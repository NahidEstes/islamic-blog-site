import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError, HttpError } from "@/lib/api";
import { learnCategorySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { LearnCategory } from "@/models/Learn";

export async function POST(request: NextRequest) {
  try {
    await authorize(request, true);
    const data = learnCategorySchema.parse(await request.json());
    const slug = slugify(data.name);
    if (!slug) throw new HttpError(400, "Enter a readable category name.");
    const item = await LearnCategory.create({ ...data, slug });
    return NextResponse.json(
      { item, message: "Learning category saved." },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
