"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson } from "@/lib/client";
export function RemoveBookmark({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true);
    try {
      await requestJson("/api/articles/" + id + "/interactions", {
        method: "DELETE",
        body: JSON.stringify({ action: "bookmark" })
      });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="button button-ghost" onClick={remove} disabled={busy}>
        Remove bookmark
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
