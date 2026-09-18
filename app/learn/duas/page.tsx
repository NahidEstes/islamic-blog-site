import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Heart, Play, Volume2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDuasPage } from "@/lib/learn";

export const metadata: Metadata = {
  title: "Learn Duas by Meaning",
  description:
    "Learn administrator-verified duas through meanings, sources, and guided phrase practice."
};

export default async function DuasPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, user] = await Promise.all([searchParams, getSession()]);
  const data = await getDuasPage(user?.id, category);
  const featured = data.featured;
  return (
    <div className="container duas-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/learn">Learn</Link> /{" "}
        <span>Duas</span>
      </nav>
      <header className="duas-heading">
        <p className="eyebrow">Read · Understand · Practice</p>
        <h1>Learn Duas by Meaning</h1>
        <p>
          Study only the duas your administrators have entered, sourced,
          verified, and published.
        </p>
      </header>

      <div className="duas-feature-grid">
        <section className="featured-dua" aria-labelledby="featured-dua-title">
          {featured ? (
            <>
              <span className="status-badge">Featured Dua</span>
              <h2 id="featured-dua-title">{featured.title}</h2>
              <p className="dua-arabic" lang="ar" dir="rtl">
                {featured.arabicText}
              </p>
              <p className="dua-meaning" lang="bn">
                {featured.banglaMeaning}
              </p>
              {featured.transliteration && (
                <p className="dua-transliteration">
                  {featured.transliteration}
                </p>
              )}
              <p className="dua-source">
                <BookOpen size={16} /> {featured.source} · {featured.reference}
              </p>
              <div className="action-row">
                <Link
                  className="button button-green"
                  href={"/learn/duas/" + encodeURIComponent(featured.slug)}
                >
                  Start Learning <ArrowRight size={16} />
                </Link>
                {featured.audioUrl && (
                  <a
                    className="button button-outline"
                    href={featured.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Volume2 size={16} /> Listen
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2 id="featured-dua-title">No featured dua yet</h2>
              <p>
                A sourced and verified dua will appear here after an
                administrator publishes it.
              </p>
            </div>
          )}
        </section>
        <section className="continue-learning" aria-labelledby="continue-title">
          <div className="section-heading">
            <h2 id="continue-title">Continue Learning</h2>
            {user && (
              <Link className="text-link" href="/account">
                Your profile
              </Link>
            )}
          </div>
          {!user ? (
            <div className="empty-state">
              <p>Log in to keep progress and favorites across visits.</p>
              <Link className="button button-outline" href="/login">
                Log in
              </Link>
            </div>
          ) : data.continueLearning.length ? (
            data.continueLearning.map((dua) => (
              <Link
                className="continue-row"
                href={"/learn/duas/" + encodeURIComponent(dua.slug)}
                key={dua.id}
              >
                <span className="learn-list-icon">
                  <Play size={17} />
                </span>
                <span>
                  <strong>{dua.title}</strong>
                  <small>
                    {dua.progressStatus.replace("-", " ")} · {dua.percent}%
                  </small>
                  <span className="progress-track">
                    <span style={{ width: dua.percent + "%" }} />
                  </span>
                </span>
                <ArrowRight size={15} />
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <p>No learning in progress yet.</p>
            </div>
          )}
        </section>
      </div>

      <section className="learn-section" aria-labelledby="dua-topics">
        <div className="section-heading">
          <h2 id="dua-topics">Explore Dua Topics</h2>
          {category && (
            <Link className="text-link" href="/learn/duas">
              Clear filter
            </Link>
          )}
        </div>
        <div className="dua-category-grid">
          {data.categories.map((item) => (
            <Link
              className={
                category === item.name ? "dua-category active" : "dua-category"
              }
              href={"/learn/duas?category=" + encodeURIComponent(item.name)}
              key={item.slug}
            >
              <Heart aria-hidden="true" />
              <h3>{item.name}</h3>
              {item.description && <p>{item.description}</p>}
              <span>{item.count} published</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="learn-section" aria-labelledby="popular-duas">
        <div className="section-heading">
          <h2 id="popular-duas">
            {category ? category + " Duas" : "Popular Duas"}
          </h2>
        </div>
        {data.popular.length ? (
          <div className="popular-dua-grid">
            {data.popular.map((dua) => (
              <Link
                href={"/learn/duas/" + encodeURIComponent(dua.slug)}
                key={dua.id}
              >
                <span className="learn-list-icon">
                  <Heart size={19} />
                </span>
                <span>
                  <span className="status-badge">{dua.category}</span>
                  <h3>{dua.title}</h3>
                  <p lang="bn">{dua.banglaMeaning}</p>
                  <small>
                    {dua.source} · {dua.reference}
                  </small>
                </span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No verified duas found{category ? " in this category" : ""}.</p>
          </div>
        )}
      </section>
    </div>
  );
}
