import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { getSettings } from "@/lib/blog";
export const metadata: Metadata = { title: "Contact" };
export default async function ContactPage() {
  const { site } = await getSettings();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">Home / Contact</div>
          <h1>Let’s Talk</h1>
          <p>
            Questions, feedback, partnership ideas, or a correction to published
            material are always welcome.
          </p>
        </div>
      </section>
      <section className="content-shell container">
        <div className="content-header">
          <h2>Send a message</h2>
          <p>
            Your message is validated and stored securely for the editorial
            team.
          </p>
        </div>
        <ContactForm />
        {site.contactEmail && (
          <p>
            Or email{" "}
            <a className="text-link" href={"mailto:" + site.contactEmail}>
              {site.contactEmail}
            </a>
          </p>
        )}
      </section>
    </>
  );
}
