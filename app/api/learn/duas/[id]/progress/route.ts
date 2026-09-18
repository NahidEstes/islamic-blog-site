import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { authorize, apiError, checkedId, HttpError } from "@/lib/api";
import { duaProgressSchema } from "@/lib/validation";
import { Dua, DuaProgress } from "@/models/Learn";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const id = checkedId((await params).id);
    const session = await getSession();
    if (!session)
      return NextResponse.json({
        currentStep: 0,
        status: "not-started",
        favorite: false
      });
    await connectToDatabase();
    const progress = await DuaProgress.findOne({
      user: session.id,
      dua: id
    }).lean();
    return NextResponse.json({
      currentStep: Number(progress?.currentStep ?? 0),
      status: String(progress?.status ?? "not-started"),
      favorite: Boolean(progress?.favorite)
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authorize(request);
    const id = checkedId((await params).id);
    const data = duaProgressSchema.parse(await request.json());
    const dua = await Dua.findOne({
      _id: id,
      status: "published",
      verified: true
    }).select("segments");
    if (!dua) throw new HttpError(404, "Published dua not found.");
    const progress =
      (await DuaProgress.findOne({ user: user.id, dua: id })) ??
      new DuaProgress({ user: user.id, dua: id });
    const now = new Date();
    if (data.action === "start") {
      progress.status =
        progress.status === "completed" ? "completed" : "in-progress";
      progress.startedAt ??= now;
    } else if (data.action === "progress") {
      const step = Math.min(data.currentStep ?? 0, dua.segments.length);
      progress.currentStep = step;
      progress.status =
        step >= dua.segments.length && dua.segments.length > 0
          ? "completed"
          : "in-progress";
      progress.startedAt ??= now;
      progress.completedAt = progress.status === "completed" ? now : undefined;
    } else if (data.action === "complete") {
      progress.currentStep = dua.segments.length;
      progress.status = "completed";
      progress.startedAt ??= now;
      progress.completedAt = now;
    } else {
      progress.favorite = data.favorite ?? !progress.favorite;
    }
    progress.lastAccessedAt = now;
    await progress.save();
    return NextResponse.json({
      currentStep: progress.currentStep,
      status: progress.status,
      favorite: progress.favorite,
      message: "Learning progress saved."
    });
  } catch (error) {
    return apiError(error);
  }
}
