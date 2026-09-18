"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { requestJson } from "@/lib/client";
import type { DuaData } from "@/lib/learn";
import { IlmBanglaLoader } from "@/components/ui/IlmBanglaLoader";

type Progress = {
  currentStep: number;
  status: string;
  favorite: boolean;
  message?: string;
};
export function DuaLearning({
  dua,
  loggedIn,
  initial
}: {
  dua: DuaData;
  loggedIn: boolean;
  initial: Progress;
}) {
  const [progress, setProgress] = useState(initial);
  const [active, setActive] = useState(
    Math.min(initial.currentStep, Math.max(0, dua.segments.length - 1))
  );
  const [busyAction, setBusyAction] = useState<
    "start" | "progress" | "complete" | "favorite" | null
  >(null);
  const busy = busyAction !== null;
  const [message, setMessage] = useState("");
  async function save(
    action: "start" | "progress" | "complete" | "favorite",
    values: Record<string, unknown> = {}
  ) {
    if (!loggedIn) {
      setMessage("Log in to save your learning progress.");
      return;
    }
    setBusyAction(action);
    setMessage("");
    try {
      const data = await requestJson<Progress>(
        "/api/learn/duas/" + dua.id + "/progress",
        {
          method: "PUT",
          body: JSON.stringify({ action, ...values })
        }
      );
      setProgress(data);
      setMessage(data.message ?? "Progress saved.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusyAction(null);
    }
  }
  function next() {
    const step = Math.min(active + 1, dua.segments.length);
    if (step < dua.segments.length) setActive(step);
    void save(step >= dua.segments.length ? "complete" : "progress", {
      currentStep: step
    });
  }
  if (!dua.segments.length)
    return (
      <section className="dua-learning-panel">
        <h2>Word-by-word learning</h2>
        <div className="empty-state">
          <p>No phrase segments have been published for this dua yet.</p>
        </div>
      </section>
    );
  const segment = dua.segments[active];
  const percent =
    progress.status === "completed"
      ? 100
      : Math.round((progress.currentStep / dua.segments.length) * 100);
  return (
    <section
      className="dua-learning-panel"
      aria-labelledby="word-learning-title"
    >
      <div className="learning-panel-heading">
        <div>
          <p className="eyebrow">Step-by-step</p>
          <h2 id="word-learning-title">Learn word by word</h2>
        </div>
        <span>{progress.status.replace("-", " ")}</span>
      </div>
      <div className="learning-progress">
        <span style={{ width: percent + "%" }} />
      </div>
      {progress.status === "not-started" && (
        <button
          className="button button-green"
          disabled={busy}
          onClick={() => save("start")}
        >
          {busyAction === "start" ? (
            <IlmBanglaLoader variant="inline" label="Starting" />
          ) : (
            <>
              <Play size={16} /> Start Learning
            </>
          )}
        </button>
      )}
      <div className="meaning-step" aria-live="polite">
        <small>
          Phrase {active + 1} of {dua.segments.length}
        </small>
        <p className="segment-arabic" lang="ar" dir="rtl">
          {segment.arabicPhrase}
        </p>
        {segment.transliteration && (
          <p className="segment-transliteration">{segment.transliteration}</p>
        )}
        <p className="segment-meaning" lang="bn">
          {segment.banglaMeaning}
        </p>
      </div>
      <div className="learning-controls">
        <button
          className="button button-outline"
          disabled={active === 0 || busy}
          onClick={() => setActive((value) => Math.max(0, value - 1))}
        >
          <ChevronLeft size={16} /> Previous
        </button>
        {active < dua.segments.length - 1 ? (
          <button
            className="button button-green"
            disabled={busy}
            onClick={next}
          >
            {busyAction === "progress" ? (
              <IlmBanglaLoader variant="inline" label="Saving" />
            ) : (
              <>
                Mark & Next <ChevronRight size={16} />
              </>
            )}
          </button>
        ) : (
          <button
            className="button button-green"
            disabled={busy || progress.status === "completed"}
            onClick={next}
          >
            {busyAction === "complete" ? (
              <IlmBanglaLoader variant="inline" label="Completing" />
            ) : (
              <>
                <Check size={16} /> Complete
              </>
            )}
          </button>
        )}
      </div>
      <div className="favorite-row">
        {loggedIn ? (
          <button
            className="button button-outline"
            disabled={busy}
            aria-pressed={progress.favorite}
            onClick={() => save("favorite", { favorite: !progress.favorite })}
          >
            {busyAction === "favorite" ? (
              <IlmBanglaLoader variant="inline" label="Updating" />
            ) : (
              <>
                <Bookmark size={16} />{" "}
                {progress.favorite ? "Saved — remove" : "Save Dua"}
              </>
            )}
          </button>
        ) : (
          <Link className="button button-outline" href="/login">
            <Bookmark size={16} /> Log in to save
          </Link>
        )}
        {message && (
          <p role="status" className="small-note">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
