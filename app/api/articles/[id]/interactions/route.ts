import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { authorize, apiError, checkedId, HttpError } from "@/lib/api";
import { isAllowed } from "@/lib/request";
import { Article } from "@/models/Article";
import { Bookmark } from "@/models/Site";
import { ArticleLike, Comment } from "@/models/Interaction";
import "@/models/User";
type Context = { params: Promise<{ id: string }> };
async function articleId(params: Context["params"]) {
  const id = checkedId((await params).id);
  await connectToDatabase();
  if (!(await Article.exists({ _id: id, status: "published" })))
    throw new HttpError(404, "Article not found.");
  return id;
}
async function state(id: string, user?: string) {
  const [likes, liked, saved, comments] = await Promise.all([
    ArticleLike.countDocuments({ article: id }),
    user ? ArticleLike.exists({ article: id, user }) : null,
    user
      ? Bookmark.exists({ user, contentType: "article", contentId: id })
      : null,
    Comment.find({ article: id, status: "approved" })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
  ]);
  return {
    likes,
    liked: Boolean(liked),
    saved: Boolean(saved),
    comments: comments.map((c) => ({
      id: String(c._id),
      name: c.user?.name ?? "Reader",
      body: c.body,
      createdAt: c.createdAt
    }))
  };
}
export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const id = await articleId(params);
    const user = await getSession();
    return NextResponse.json(await state(id, user?.id));
  } catch (e) {
    return apiError(e);
  }
}
async function change(
  request: NextRequest,
  { params }: Context,
  remove: boolean
) {
  try {
    const user = await authorize(request);
    const id = await articleId(params);
    const { action } = z
      .object({ action: z.enum(["bookmark", "like"]) })
      .parse(await request.json());
    if (action === "bookmark") {
      const filter = { user: user.id, contentType: "article", contentId: id };
      if (remove) await Bookmark.deleteOne(filter);
      else
        await Bookmark.updateOne(
          filter,
          { $setOnInsert: filter },
          { upsert: true }
        );
    } else {
      const filter = { user: user.id, article: id };
      if (remove) await ArticleLike.deleteOne(filter);
      else
        await ArticleLike.updateOne(
          filter,
          { $setOnInsert: filter },
          { upsert: true }
        );
    }
    return NextResponse.json(await state(id, user.id));
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(r: NextRequest, c: Context) {
  return change(r, c, false);
}
export async function DELETE(r: NextRequest, c: Context) {
  return change(r, c, true);
}
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const user = await authorize(request);
    const id = await articleId(params);
    if (!isAllowed(request, "comment:" + user.id, 6))
      throw new HttpError(429, "Please wait before commenting again.");
    const { body } = z
      .object({ body: z.string().trim().min(3).max(3000) })
      .parse(await request.json());
    await Comment.create({
      user: user.id,
      article: id,
      body,
      status: "pending"
    });
    return NextResponse.json(
      { message: "Thank you. Your comment is awaiting approval." },
      { status: 201 }
    );
  } catch (e) {
    return apiError(e);
  }
}
