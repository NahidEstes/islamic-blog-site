import Link from "next/link";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Dua } from "@/models/Learn";
export default async function PreviewDuaPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await connectToDatabase();
  const dua = await Dua.findById(id).lean();
  if (!dua) notFound();
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Preview Dua</h1>
          <p className="small-note">
            Private administrator preview · {dua.status} ·{" "}
            {dua.verified ? "verified" : "not verified"}
          </p>
        </div>
        <Link
          className="button button-outline"
          href={"/admin/duas/" + id + "/edit"}
        >
          Back to editor
        </Link>
      </div>
      <article className="dua-reading-card">
        <span className="status-badge">{dua.category}</span>
        <h1>{dua.title}</h1>
        <p className="dua-arabic" lang="ar" dir="rtl">
          {dua.arabicText}
        </p>
        {dua.transliteration && (
          <p className="dua-transliteration">{dua.transliteration}</p>
        )}
        <p className="dua-full-meaning" lang="bn">
          {dua.banglaMeaning}
        </p>
        <section className="dua-reference-box">
          <h2>Source and reference</h2>
          <p>{dua.source}</p>
          <p>{dua.reference}</p>
        </section>
        {dua.segments?.length ? (
          <div className="preview-segments">
            {[...dua.segments]
              .sort((a, b) => a.order - b.order)
              .map((segment) => (
                <div key={segment.order}>
                  <p lang="ar" dir="rtl">
                    {segment.arabicPhrase}
                  </p>
                  <p>{segment.transliteration}</p>
                  <p lang="bn">{segment.banglaMeaning}</p>
                </div>
              ))}
          </div>
        ) : null}
      </article>
    </>
  );
}
