"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client";
export function TaxonomyManager({
  type,
  initial
}: {
  type: "category" | "tag";
  initial?: { _id: string; name: string; description: string };
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(form: FormData) {
    setBusy(true);
    try {
      await requestJson(
        "/api/admin/taxonomies" + (initial ? "/" + initial._id : ""),
        {
          method: initial ? "PATCH" : "POST",
          body: JSON.stringify({ ...Object.fromEntries(form), type })
        }
      );
      setMessage("Saved.");
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
        Name
        <input
          name="name"
          defaultValue={initial?.name}
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          defaultValue={initial?.description}
          maxLength={500}
          rows={2}
        />
      </label>
      <div>
        <button className="button button-green" disabled={busy}>
          {initial ? "Save changes" : "Create " + type}
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
