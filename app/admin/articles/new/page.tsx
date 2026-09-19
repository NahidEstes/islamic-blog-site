import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { getTaxonomies } from "@/lib/blog";
export default async function NewArticlePage() {
  const [categories, tags] = await Promise.all([
    getTaxonomies("category"),
    getTaxonomies("tag")
  ]);
  return (
    <ArticleEditor
      categories={categories.map((c) => c.name)}
      tags={tags.map((t) => t.name)}
    />
  );
}
