"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client";
import { IlmBanglaLoader } from "@/components/ui/IlmBanglaLoader";
export function RecordActions({
  endpoint,
  status,
  statuses,
  allowDelete = true,
  role,
  roles
}: {
  endpoint: string;
  status?: string;
  statuses?: string[];
  allowDelete?: boolean;
  role?: string;
  roles?: string[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<"PATCH" | "DELETE" | null>(null);
  const busy = busyAction !== null;
  async function save(form: FormData) {
    await run("PATCH", Object.fromEntries(form));
  }
  async function run(method: string, body?: unknown) {
    if (
      method === "DELETE" &&
      !confirm("Permanently delete this record? This cannot be undone.")
    )
      return;
    setBusyAction(method === "DELETE" ? "DELETE" : "PATCH");
    setMessage("");
    try {
      await requestJson(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined
      });
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusyAction(null);
    }
  }
  return (
    <div>
      <form action={save} className="action-row">
        {statuses && (
          <>
            <select name="status" defaultValue={status} aria-label="Status">
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {roles && (
              <select name="role" defaultValue={role} aria-label="Role">
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            )}
            <button className="button button-outline" disabled={busy}>
              {busyAction === "PATCH" ? (
                <IlmBanglaLoader variant="inline" label="Saving" />
              ) : (
                "Save"
              )}
            </button>
          </>
        )}
        {allowDelete && (
          <button
            className="button button-danger"
            type="button"
            onClick={() => run("DELETE")}
            disabled={busy}
          >
            {busyAction === "DELETE" ? (
              <IlmBanglaLoader variant="inline" label="Deleting" />
            ) : (
              "Delete"
            )}
          </button>
        )}
      </form>
      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
