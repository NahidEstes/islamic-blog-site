import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorize, apiError, checkedId, HttpError } from "@/lib/api";
import { quoteSchema, taxonomySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { Quote } from "@/models/Quote";
import { Comment } from "@/models/Interaction";
import { Taxonomy } from "@/models/Taxonomy";
import { Article } from "@/models/Article";
import { User } from "@/models/User";
import { ContactMessage, NewsletterSubscriber } from "@/models/Communication";
import { ActivityLog } from "@/models/Site";
type Context = { params: Promise<{ resource: string; id: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const actor = await authorize(request, true);
    const { resource, id: rawId } = await params;
    const id = checkedId(rawId);
    const body = await request.json();
    let item;
    if (resource === "quotes") {
      const data = quoteSchema.parse(body);
      const existing = await Quote.findById(id);
      if (existing?.isDemo && data.published)
        throw new HttpError(
          400,
          "Demo placeholders cannot be published. Create a sourced quote instead."
        );
      item = await Quote.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after", runValidators: true }
      );
    } else if (resource === "comments") {
      const data = z
        .object({ status: z.enum(["pending", "approved", "hidden"]) })
        .parse(body);
      item = await Comment.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after" }
      );
    } else if (resource === "taxonomies") {
      const data = taxonomySchema.parse(body);
      const existing = await Taxonomy.findById(id);
      if (!existing) throw new HttpError(404, "Topic not found.");
      if (existing.type !== data.type)
        throw new HttpError(400, "Topic type cannot change.");
      const slug = slugify(data.name);
      if (!slug) throw new HttpError(400, "Enter a readable name.");
      const previousName = existing.name;
      item = await Taxonomy.findByIdAndUpdate(
        id,
        { $set: { ...data, slug } },
        { returnDocument: "after", runValidators: true }
      );
      if (previousName !== data.name) {
        if (data.type === "category")
          await Article.updateMany(
            { category: previousName },
            { $set: { category: data.name } }
          );
        else
          await Article.updateMany(
            { tags: previousName },
            { $set: { "tags.$[tag]": data.name } },
            { arrayFilters: [{ tag: previousName }] }
          );
      }
    } else if (resource === "users") {
      const data = z
        .object({
          status: z.enum(["active", "suspended"]),
          role: z.enum(["user", "author", "editor", "admin", "super-admin"])
        })
        .parse(body);
      const target = await User.findById(id);
      if (!target) throw new HttpError(404, "User not found.");
      if (id === actor.id)
        throw new HttpError(400, "You cannot change your own access.");
      if (
        actor.role !== "super-admin" &&
        (target.role !== "user" || data.role !== "user")
      )
        throw new HttpError(
          403,
          "Only a super administrator can change staff access."
        );
      if (
        target.role === "super-admin" &&
        (data.role !== "super-admin" || data.status !== "active") &&
        (await User.countDocuments({
          role: "super-admin",
          status: "active"
        })) <= 1
      )
        throw new HttpError(
          400,
          "Keep at least one active super administrator."
        );
      item = await User.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after", runValidators: true }
      ).select("name email role status");
    } else if (resource === "messages") {
      const data = z
        .object({ status: z.enum(["unread", "read", "archived"]) })
        .parse(body);
      item = await ContactMessage.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after" }
      );
    } else if (resource === "newsletter") {
      const data = z
        .object({ status: z.enum(["active", "unsubscribed"]) })
        .parse(body);
      item = await NewsletterSubscriber.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after" }
      );
    } else throw new HttpError(404, "Unknown section.");
    if (!item) throw new HttpError(404, "Record not found.");
    await ActivityLog.create({
      actor: actor.id,
      action: resource + ".updated",
      entityType: resource,
      entityId: id
    });
    return NextResponse.json({ item, message: "Saved." });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    await authorize(request, true);
    const { resource, id: rawId } = await params;
    const id = checkedId(rawId);
    let item;
    if (resource === "quotes") item = await Quote.findByIdAndDelete(id);
    else if (resource === "comments")
      item = await Comment.findByIdAndDelete(id);
    else if (resource === "taxonomies") {
      const topic = await Taxonomy.findById(id);
      if (!topic) throw new HttpError(404, "Topic not found.");
      if (
        await Article.exists(
          topic.type === "category"
            ? { category: topic.name }
            : { tags: topic.name }
        )
      )
        throw new HttpError(
          409,
          "This topic is used by articles. Reassign those articles before deleting it."
        );
      item = await Taxonomy.findByIdAndDelete(id);
    } else if (resource === "messages")
      item = await ContactMessage.findByIdAndDelete(id);
    else if (resource === "newsletter")
      item = await NewsletterSubscriber.findByIdAndDelete(id);
    else
      throw new HttpError(400, "Deletion is not available for this section.");
    if (!item) throw new HttpError(404, "Record not found.");
    return NextResponse.json({ message: "Record deleted." });
  } catch (e) {
    return apiError(e);
  }
}
