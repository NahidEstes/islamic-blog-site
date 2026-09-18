import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError, checkedId, HttpError } from "@/lib/api";
import { duaSchema } from "@/lib/validation";
import { Dua, DuaProgress } from "@/models/Learn";
import { ActivityLog } from "@/models/Site";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await authorize(request, true);
    const id = checkedId((await params).id);
    const data = duaSchema.parse(await request.json());
    const existing = await Dua.findById(id);
    if (!existing) throw new HttpError(404, "Dua not found.");
    const now = new Date();
    const item = await Dua.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          segments: [...data.segments].sort((a, b) => a.order - b.order),
          ...(data.status === "published" && !existing.publishedAt
            ? { publishedAt: now }
            : {}),
          archivedAt: data.status === "archived" ? now : undefined
        }
      },
      { returnDocument: "after", runValidators: true }
    );
    await ActivityLog.create({
      actor: user.id,
      action: "dua.updated",
      entityType: "Dua",
      entityId: id
    });
    return NextResponse.json({ item, message: "Dua saved." });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await authorize(request, true);
    const id = checkedId((await params).id);
    const item = await Dua.findByIdAndDelete(id);
    if (!item) throw new HttpError(404, "Dua not found.");
    await DuaProgress.deleteMany({ dua: id });
    await ActivityLog.create({
      actor: user.id,
      action: "dua.deleted",
      entityType: "Dua",
      entityId: id
    });
    return NextResponse.json({
      message: "Dua and its learning progress were deleted."
    });
  } catch (error) {
    return apiError(error);
  }
}
