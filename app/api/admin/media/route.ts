import { NextRequest, NextResponse } from "next/server";
import { mongo } from "mongoose";
import { authorize, apiError, HttpError } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
export async function POST(request: NextRequest) {
  try {
    await authorize(request, true);
    const form = await request.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      file.size < 12
    )
      throw new HttpError(400, "Choose a PNG, JPEG, or WebP image under 5 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
    if (!png && !jpg && !webp)
      throw new HttpError(400, "Only PNG, JPEG, and WebP files are allowed.");
    const mongoose = await connectToDatabase();
    const bucket = new mongo.GridFSBucket(mongoose.connection.db!, {
      bucketName: "articleImages"
    });
    const stream = bucket.openUploadStream("article-image", {
      metadata: {
        contentType: png ? "image/png" : jpg ? "image/jpeg" : "image/webp"
      }
    });
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", () => resolve());
      stream.on("error", reject);
      stream.end(bytes);
    });
    return NextResponse.json(
      { url: "/api/media/" + stream.id },
      { status: 201 }
    );
  } catch (e) {
    return apiError(e);
  }
}
