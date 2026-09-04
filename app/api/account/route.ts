import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorize, apiError } from "@/lib/api";
import { User } from "@/models/User";
export async function PATCH(request: NextRequest) {
  try {
    const user = await authorize(request);
    const data = z
      .object({
        name: z.string().trim().min(2).max(80),
        bio: z.string().trim().max(500)
      })
      .parse(await request.json());
    await User.updateOne(
      { _id: user.id },
      { $set: data },
      { runValidators: true }
    );
    return NextResponse.json({ message: "Profile saved." });
  } catch (e) {
    return apiError(e);
  }
}
