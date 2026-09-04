"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client";
export type QuoteData = {
  _id?: string;
  quote?: string;
  scholar?: string;
  source?: string;
  sourceUrl?: string;
  published?: boolean;
  featured?: boolean;
  verified?: boolean;
  isDemo?: boolean;
};
export function QuoteEditor({ initial = {} }: { initial?: QuoteData }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(form: FormData) {
    setBusy(true);
    try {
      const data = {
        ...Object.fromEntries(form),
        published: form.has("published"),
        featured: form.has("featured"),
        verified: form.has("verified")
      };
      await requestJson(
        initial._id ? "/api/admin/quotes/" + initial._id : "/api/admin/quotes",
        { method: initial._id ? "PATCH" : "POST", body: JSON.stringify(data) }
      );
      setMessage("Quote saved.");
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form action={save} className="form-stack">
      <label>
        Quotation
        <textarea
          name="quote"
          defaultValue={initial.quote}
          rows={4}
          required
          minLength={10}
          maxLength={3000}
        />
      </label>
      <label>
        Scholar / Salaf name
        <input
          name="scholar"
          defaultValue={initial.scholar}
          required
          maxLength={150}
        />
      </label>
      <label>
        Source / reference
        <input
          name="source"
          defaultValue={initial.source}
          required
          minLength={3}
          maxLength={500}
        />
      </label>
      <label>
        Source URL (optional)
        <input name="sourceUrl" type="url" defaultValue={initial.sourceUrl} />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="verified"
          defaultChecked={initial.verified}
        />{" "}
        I checked the exact wording, attribution, and source.
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="published"
          defaultChecked={initial.published}
          disabled={initial.isDemo}
        />{" "}
        Published
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={initial.featured}
        />{" "}
        Featured on homepage
      </label>
      {initial.isDemo && (
        <p className="notice">
          Development placeholder — cannot be published. Create a new entry for
          a genuine sourced quotation.
        </p>
      )}
      <div>
        <button className="button button-green" disabled={busy}>
          {busy ? "Saving…" : "Save quote"}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
