import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BookText,
  Heart,
  Languages,
  Leaf,
  ListChecks,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { getLearnOverview, learningModules } from "@/lib/learn";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Learn with Meaning",
  description:
    "Small, guided learning with verified sources and clear meanings."
};

const icons = {
  duas: Heart,
  quran: BookOpen,
  hadith: BookText,
  "arabic-stories": Leaf,
  vocabulary: Languages,
  practice: ListChecks
};

export default async function LearnPage() {
  const data = await getLearnOverview();
  return (
    <div className="container learn-page">
      <section className="learn-intro">
        <div>
          <p className="eyebrow">A journey of knowledge</p>
          <h1>Learn with Meaning</h1>
          <p>
            Take small, meaningful steps with clear explanations, reviewed
            sources, and learning progress that stays with your account.
          </p>
          <Link className="button button-green" href="/learn/duas">
            Explore Duas <ArrowRight size={16} />
          </Link>
        </div>
        <div className="learn-intro-art" aria-hidden="true">
          <BookOpen />
          <span>Read · Understand · Practice</span>
        </div>
      </section>
      <section className="learn-section" aria-labelledby="learn-topics">
        <div className="section-heading">
          <h2 id="learn-topics">Explore learning topics</h2>
        </div>
        <div className="learn-topic-grid">
          {learningModules.map((module) => {
            const Icon = icons[module.slug];
            const available = module.slug === "duas";
            const content = (
              <>
                <Icon aria-hidden="true" />
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <span>
                  {available
                    ? (data.counts.duas ?? 0) + " published"
                    : "Coming next"}
                </span>
              </>
            );
            return available ? (
              <Link
                className="learn-topic-card"
                href="/learn/duas"
                key={module.slug}
              >
                {content}
              </Link>
            ) : (
              <div className="learn-topic-card is-upcoming" key={module.slug}>
                {content}
              </div>
            );
          })}
        </div>
      </section>
      <div className="learn-editorial-grid">
        <section className="learn-section" aria-labelledby="featured-paths">
          <div className="section-heading">
            <h2 id="featured-paths">Featured Learning Paths</h2>
            <Link className="text-link" href="/learn/duas">
              View all
            </Link>
          </div>
          {data.featured.length ? (
            <div className="learn-path-grid">
              {data.featured.map((dua) => (
                <Link
                  className="learn-path-card"
                  href={"/learn/duas/" + encodeURIComponent(dua.slug)}
                  key={dua.id}
                >
                  <span className="status-badge">{dua.category}</span>
                  <h3>{dua.title}</h3>
                  <p lang="bn">{dua.banglaMeaning}</p>
                  <span className="text-link">Start learning</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No featured paths yet</h3>
              <p>
                Verified learning paths published by an administrator will
                appear here.
              </p>
            </div>
          )}
        </section>
        <section className="learn-section" aria-labelledby="recent-learning">
          <div className="section-heading">
            <h2 id="recent-learning">Recently Added</h2>
            <Link className="text-link" href="/learn/duas">
              View all
            </Link>
          </div>
          {data.recent.length ? (
            <div className="learn-recent-list">
              {data.recent.map((dua) => (
                <Link
                  href={"/learn/duas/" + encodeURIComponent(dua.slug)}
                  key={dua.id}
                >
                  <span className="learn-list-icon">
                    <Heart size={18} />
                  </span>
                  <span>
                    <strong>{dua.title}</strong>
                    <small>
                      {formatDate(dua.publishedAt)} · {dua.category}
                    </small>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No verified learning content has been published yet.</p>
            </div>
          )}
        </section>
      </div>
      <section className="learn-section" aria-labelledby="why-learn-here">
        <div className="section-heading">
          <h2 id="why-learn-here">Why Learn Here?</h2>
        </div>
        <div className="learn-benefits">
          {[
            [
              ShieldCheck,
              "Reviewed before publishing",
              "Religious content stays private until an administrator verifies its source."
            ],
            [
              BookOpen,
              "Meaning in context",
              "Read the complete text, meaning, transliteration, and reference together."
            ],
            [
              Sparkles,
              "Small guided steps",
              "Work through ordered phrase meanings at a comfortable pace."
            ],
            [
              ListChecks,
              "Progress that persists",
              "Signed-in learners can continue where they stopped on any device."
            ]
          ].map(([Icon, title, body]) => (
            <article key={String(title)}>
              <Icon aria-hidden="true" />
              <div>
                <h3>{String(title)}</h3>
                <p>{String(body)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
