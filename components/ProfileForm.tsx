"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson } from "@/lib/client";
export function ProfileForm({ name, bio }: { name: string; bio: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(form: FormData) {
    setBusy(true);
    try {
      const data = await requestJson("/api/account", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(form))
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
    <form action={save} className="form-stack">
      <label>
        Name
        <input
          name="name"
          defaultValue={name}
          minLength={2}
          maxLength={80}
          required
        />
      </label>
      <label>
        Bio
        <textarea name="bio" defaultValue={bio} rows={3} maxLength={500} />
      </label>
      <div>
        <button className="button button-green" disabled={busy}>
          Save profile
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
