import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Volume2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDua, getDuaProgress } from "@/lib/learn";
import { DuaLearning } from "@/components/DuaLearning";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const dua = await getDua((await params).slug);
  return dua
    ? { title: dua.title, description: dua.banglaMeaning.slice(0, 160) }
    : { title: "Dua not found" };
}
export default async function DuaPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const dua = await getDua((await params).slug);
  if (!dua) notFound();
  const user = await getSession();
  const progress = await getDuaProgress(dua.id, user?.id);
  return (
    <div className="container dua-detail-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/learn">Learn</Link> /{" "}
        <Link href="/learn/duas">Duas</Link> / <span>{dua.title}</span>
      </nav>
      <div className="dua-detail-grid">
        <article className="dua-reading-card">
          <span className="status-badge">{dua.category}</span>
          <h1>{dua.title}</h1>
          <p className="dua-arabic" lang="ar" dir="rtl">
            {dua.arabicText}
          </p>
          {dua.transliteration && (
            <section>
              <h2>Transliteration</h2>
              <p className="dua-transliteration">{dua.transliteration}</p>
            </section>
          )}
          <section lang="bn">
            <h2>বাংলা অর্থ</h2>
            <p className="dua-full-meaning">{dua.banglaMeaning}</p>
          </section>
          <section className="dua-reference-box">
            <h2>
              <BookOpen size={18} /> Source and reference
            </h2>
            <p>{dua.source}</p>
            <p>{dua.reference}</p>
            {dua.sourceUrl && (
              <a
                className="text-link"
                href={dua.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source
              </a>
            )}
          </section>
          {dua.audioUrl && (
            <section className="dua-audio">
              <h2>
                <Volume2 size={18} /> Listen
              </h2>
              <audio controls preload="none" src={dua.audioUrl}>
                Your browser cannot play this audio.
              </audio>
            </section>
          )}
        </article>
        <DuaLearning dua={dua} loggedIn={Boolean(user)} initial={progress} />
      </div>
    </div>
  );
}
