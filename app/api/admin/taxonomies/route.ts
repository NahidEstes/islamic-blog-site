import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError, HttpError } from "@/lib/api";
import { taxonomySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { Taxonomy } from "@/models/Taxonomy";
export async function POST(request: NextRequest) {
  try {
    await authorize(request, true);
    const data = taxonomySchema.parse(await request.json());
    const slug = slugify(data.name);
    if (!slug) throw new HttpError(400, "Enter a readable name.");
    const item = await Taxonomy.create({ ...data, slug });
    return NextResponse.json(
      { item, message: "Topic created." },
      { status: 201 }
    );
  } catch (e) {
    return apiError(e);
  }
}
