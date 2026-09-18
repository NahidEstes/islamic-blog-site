import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError, checkedId, HttpError } from "@/lib/api";
import { learnCategorySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { Dua, LearnCategory } from "@/models/Learn";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await authorize(request, true);
    const id = checkedId((await params).id);
    const data = learnCategorySchema.parse(await request.json());
    const existing = await LearnCategory.findById(id);
    if (!existing) throw new HttpError(404, "Learning category not found.");
    const item = await LearnCategory.findByIdAndUpdate(
      id,
      { $set: { ...data, slug: slugify(data.name) } },
      { returnDocument: "after", runValidators: true }
    );
    if (existing.module === "duas" && existing.name !== data.name)
      await Dua.updateMany(
        { category: existing.name },
        { $set: { category: data.name } }
      );
    return NextResponse.json({ item, message: "Learning category saved." });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    await authorize(request, true);
    const id = checkedId((await params).id);
    const category = await LearnCategory.findById(id);
    if (!category) throw new HttpError(404, "Learning category not found.");
    if (
      category.module === "duas" &&
      (await Dua.exists({ category: category.name }))
    )
      throw new HttpError(
        409,
        "Reassign the duas in this category before deleting it."
      );
    await category.deleteOne();
    return NextResponse.json({ message: "Learning category deleted." });
  } catch (error) {
    return apiError(error);
  }
}
