import type { Metadata } from "next";
export const metadata: Metadata = { title: "About" };
export default function AboutPage() {
  return (
    <div className="container content-shell">
      <div className="content-header">
        <h1>A quiet place for meaningful reading.</h1>
        <p>
          This blog brings together articles in Bangla and English on learning,
          character, and everyday life.
        </p>
      </div>
      <div className="resource-grid">
        <section className="resource-card">
          <h2>Our purpose</h2>
          <p>
            Make thoughtful Islamic reading approachable, with a simple
            experience that puts words first.
          </p>
        </section>
        <section className="resource-card">
          <h2>Editorial care</h2>
          <p>
            We ask editors to check sources before publishing religious
            material. Scholar quotations require a reference and editorial
            verification.
          </p>
        </section>
        <section className="resource-card">
          <h2>Corrections welcome</h2>
          <p>
            If you notice a mistake or an unclear reference, please contact us
            with the article link and details. We value careful, responsible
            reading.
          </p>
        </section>
      </div>
    </div>
  );
}
