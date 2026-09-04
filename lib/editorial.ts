import { Taxonomy } from "@/models/Taxonomy";
import { slugify } from "@/lib/utils";

// Articles keep the existing readable category/tag strings. Ensure new labels
// also appear in the topic directory without introducing duplicate models.
export async function ensureTopics(category: string, tags: string[]) {
  const topics = [
    { type: "category", name: category },
    ...tags.map((name) => ({ type: "tag", name }))
  ];
  for (const { type, name } of topics) {
    const slug = slugify(name);
    if (!slug) continue;
    await Taxonomy.updateOne(
      { type, slug },
      { $setOnInsert: { name } },
      { upsert: true }
    );
  }
}
