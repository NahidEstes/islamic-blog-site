"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client";
export function SettingsEditor({
  settingKey,
  initialValue
}: {
  settingKey: "site" | "homepage";
  initialValue: Record<string, unknown>;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const fields =
    settingKey === "site"
      ? [
          ["name", "Site name"],
          ["description", "Default SEO description"],
          ["contactEmail", "Contact email"],
          ["footerText", "Footer text"]
        ]
      : [
          ["introHeading", "Welcome heading"],
          ["introText", "Welcome text"],
          ["featuredSlug", "Featured article slug (optional override)"],
          ["newsletterHeading", "Newsletter heading"],
          ["newsletterText", "Newsletter text"]
        ];
  async function save(form: FormData) {
    setBusy(true);
    try {
      const data = await requestJson("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          key: settingKey,
          value: Object.fromEntries(form)
        })
      });
      setMessage(data.message);
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form action={save} className="panel form-stack">
      {fields.map(([name, label]) => (
        <label key={name}>
          {label}
          <input
            name={name}
            defaultValue={String(initialValue[name] ?? "")}
            type={name === "contactEmail" ? "email" : "text"}
            required={name === "name" || name === "introHeading"}
          />
        </label>
      ))}
      <p className="small-note">
        The homepage uses published articles only. The featured slug overrides
        the article’s Featured checkbox.
      </p>
      {message && <p role="status">{message}</p>}
      <div>
        <button className="button button-green" disabled={busy}>
          Save settings
        </button>
      </div>
    </form>
  );
}
