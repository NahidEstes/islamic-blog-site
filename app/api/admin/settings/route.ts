import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError, HttpError } from "@/lib/api";
import { siteSettingsSchema, homepageSettingsSchema } from "@/lib/validation";
import { SiteSetting, ActivityLog } from "@/models/Site";
export async function PUT(request: NextRequest) {
  try {
    const user = await authorize(request, true);
    const body = await request.json();
    if (!["site", "homepage"].includes(body.key))
      throw new HttpError(400, "Invalid settings section.");
    const value =
      body.key === "site"
        ? siteSettingsSchema.parse(body.value)
        : homepageSettingsSchema.parse(body.value);
    await SiteSetting.updateOne(
      { key: body.key },
      { $set: { value, updatedBy: user.id } },
      { upsert: true }
    );
    await ActivityLog.create({
      actor: user.id,
      action: "settings.updated",
      entityType: "SiteSetting"
    });
    return NextResponse.json({ message: "Settings saved." });
  } catch (e) {
    return apiError(e);
  }
}
