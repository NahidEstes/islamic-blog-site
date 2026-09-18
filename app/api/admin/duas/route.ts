import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError } from "@/lib/api";
import { duaSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { Dua } from "@/models/Learn";
import { ActivityLog } from "@/models/Site";

export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request, true);
    const data = duaSchema.parse(await request.json());
    const base = slugify(data.title) || "dua";
    let slug = base;
    let suffix = 2;
    while (await Dua.exists({ slug })) slug = base + "-" + suffix++;
    const now = new Date();
    const dua = await Dua.create({
      ...data,
      segments: [...data.segments].sort((a, b) => a.order - b.order),
      slug,
      author: user.id,
      publishedAt: data.status === "published" ? now : undefined,
      archivedAt: data.status === "archived" ? now : undefined
    });
    await ActivityLog.create({
      actor: user.id,
      action: "dua.created",
      entityType: "Dua",
      entityId: dua._id
    });
    return NextResponse.json(
      { item: dua, message: "Dua saved." },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
