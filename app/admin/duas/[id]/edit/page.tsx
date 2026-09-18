import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Dua, LearnCategory } from "@/models/Learn";
import { DuaEditor } from "@/components/admin/DuaEditor";
export default async function EditDuaPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await connectToDatabase();
  const [dua, categories] = await Promise.all([
    Dua.findById(id).lean(),
    LearnCategory.find({ module: "duas" })
      .sort({ order: 1 })
      .select("name")
      .lean()
  ]);
  if (!dua) notFound();
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Edit Dua</h1>
          <p>Review the exact wording and reference before publishing.</p>
        </div>
      </div>
      <DuaEditor
        initial={JSON.parse(JSON.stringify(dua))}
        categories={categories.map((row) => String(row.name))}
      />
    </>
  );
}
