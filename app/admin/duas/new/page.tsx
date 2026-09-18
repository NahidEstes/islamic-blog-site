import { connectToDatabase } from "@/lib/db";
import { LearnCategory } from "@/models/Learn";
import { DuaEditor } from "@/components/admin/DuaEditor";
export default async function NewDuaPage() {
  await connectToDatabase();
  const rows = await LearnCategory.find({ module: "duas" })
    .sort({ order: 1 })
    .select("name")
    .lean();
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Create Dua</h1>
          <p>Nothing is public until you verify and publish it.</p>
        </div>
      </div>
      <DuaEditor categories={rows.map((row) => String(row.name))} />
    </>
  );
}
