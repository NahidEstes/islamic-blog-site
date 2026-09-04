import { NextRequest } from "next/server";
import { mongo } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { checkedId, apiError, HttpError } from "@/lib/api";
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = new mongo.ObjectId(checkedId((await params).id));
    const mongoose = await connectToDatabase();
    const bucket = new mongo.GridFSBucket(mongoose.connection.db!, {
      bucketName: "articleImages"
    });
    const files = await bucket.find({ _id: id }).limit(1).toArray();
    if (!files.length) throw new HttpError(404, "Image not found.");
    const chunks: Buffer[] = [];
    for await (const chunk of bucket.openDownloadStream(id))
      chunks.push(Buffer.from(chunk));
    return new Response(new Uint8Array(Buffer.concat(chunks)), {
      headers: {
        "content-type": String(
          files[0].metadata?.contentType ?? "application/octet-stream"
        ),
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff"
      }
    });
  } catch (e) {
    return apiError(e);
  }
}
