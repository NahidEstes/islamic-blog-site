"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { requestJson } from "@/lib/client";

type Segment = {
  arabicPhrase: string;
  transliteration: string;
  banglaMeaning: string;
  order: number;
};
type DuaForm = {
  _id?: string;
  title?: string;
  arabicText?: string;
  banglaMeaning?: string;
  transliteration?: string;
  category?: string;
  source?: string;
  reference?: string;
  sourceUrl?: string;
  audioUrl?: string;
  segments?: Segment[];
  featured?: boolean;
  verified?: boolean;
  status?: string;
};
export function DuaEditor({
  initial,
  categories
}: {
  initial?: DuaForm;
  categories: string[];
}) {
  const router = useRouter();
  const [segments, setSegments] = useState<Segment[]>(
    [...(initial?.segments ?? [])].sort((a, b) => a.order - b.order)
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function update(index: number, field: keyof Segment, value: string) {
    setSegments((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= segments.length) return;
    setSegments((items) => {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  async function save(form: FormData) {
    setBusy(true);
    setMessage("");
    try {
      const body = {
        title: form.get("title"),
        arabicText: form.get("arabicText"),
        banglaMeaning: form.get("banglaMeaning"),
        transliteration: form.get("transliteration"),
        category: form.get("category"),
        source: form.get("source"),
        reference: form.get("reference"),
        sourceUrl: form.get("sourceUrl"),
        audioUrl: form.get("audioUrl"),
        status: form.get("status"),
        featured: form.get("featured") === "on",
        verified: form.get("verified") === "on",
        segments: segments.map((segment, index) => ({
          ...segment,
          order: index + 1
        }))
      };
      const data = await requestJson<{
        item: { _id: string };
        message: string;
      }>(initial?._id ? "/api/admin/duas/" + initial._id : "/api/admin/duas", {
        method: initial?._id ? "PATCH" : "POST",
        body: JSON.stringify(body)
      });
      setMessage(data.message);
      if (!initial?._id) router.push("/admin/duas/" + data.item._id + "/edit");
      else router.refresh();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form action={save} className="form-stack">
      <p className="notice">
        Enter exact content from a reliable source. A dua cannot be published
        until “Source verified” is checked.
      </p>
      <label>
        Title
        <input
          name="title"
          required
          minLength={3}
          maxLength={180}
          defaultValue={initial?.title}
        />
      </label>
      <label>
        Arabic full text
        <textarea
          name="arabicText"
          lang="ar"
          dir="rtl"
          required
          rows={5}
          maxLength={10000}
          defaultValue={initial?.arabicText}
        />
      </label>
      <label>
        Bangla full meaning
        <textarea
          name="banglaMeaning"
          lang="bn"
          required
          rows={5}
          maxLength={10000}
          defaultValue={initial?.banglaMeaning}
        />
      </label>
      <label>
        Transliteration (optional)
        <textarea
          name="transliteration"
          rows={3}
          maxLength={10000}
          defaultValue={initial?.transliteration}
        />
      </label>
      <div className="form-row">
        <label>
          Category
          <input
            name="category"
            list="dua-categories"
            required
            minLength={2}
            maxLength={80}
            defaultValue={initial?.category}
          />
          <datalist id="dua-categories">
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </datalist>
        </label>
        <label>
          Status
          <select name="status" defaultValue={initial?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Source
          <input
            name="source"
            required
            maxLength={500}
            defaultValue={initial?.source}
          />
        </label>
        <label>
          Reference
          <input
            name="reference"
            required
            maxLength={500}
            defaultValue={initial?.reference}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Source URL (optional)
          <input
            name="sourceUrl"
            type="url"
            maxLength={1000}
            defaultValue={initial?.sourceUrl}
          />
        </label>
        <label>
          Audio URL (optional)
          <input
            name="audioUrl"
            type="url"
            maxLength={1000}
            defaultValue={initial?.audioUrl}
          />
        </label>
      </div>
      <label className="checkbox">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={initial?.featured}
        />{" "}
        Featured learning item
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="verified"
          defaultChecked={initial?.verified}
        />{" "}
        Source verified against the entered reference
      </label>
      <section className="segment-editor">
        <div className="admin-title">
          <div>
            <h2>Word-by-word meaning</h2>
            <p className="small-note">The displayed order follows this list.</p>
          </div>
          <button
            className="button button-outline"
            type="button"
            onClick={() =>
              setSegments((items) => [
                ...items,
                {
                  arabicPhrase: "",
                  transliteration: "",
                  banglaMeaning: "",
                  order: items.length + 1
                }
              ])
            }
          >
            <Plus size={16} /> Add segment
          </button>
        </div>
        {segments.length ? (
          segments.map((segment, index) => (
            <div className="segment-editor-row" key={index}>
              <strong>{index + 1}</strong>
              <label>
                Arabic phrase
                <input
                  lang="ar"
                  dir="rtl"
                  value={segment.arabicPhrase}
                  onChange={(event) =>
                    update(index, "arabicPhrase", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                Transliteration
                <input
                  value={segment.transliteration}
                  onChange={(event) =>
                    update(index, "transliteration", event.target.value)
                  }
                />
              </label>
              <label>
                Bangla meaning
                <input
                  lang="bn"
                  value={segment.banglaMeaning}
                  onChange={(event) =>
                    update(index, "banglaMeaning", event.target.value)
                  }
                  required
                />
              </label>
              <div className="segment-buttons">
                <button
                  type="button"
                  aria-label="Move segment up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Move segment down"
                  disabled={index === segments.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Remove segment"
                  onClick={() =>
                    setSegments((items) =>
                      items.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">
            No meaning segments yet. Add only segments you have reviewed.
          </p>
        )}
      </section>
      <div className="action-row">
        <button className="button button-green" disabled={busy}>
          {busy ? "Saving…" : "Save Dua"}
        </button>
        {initial?._id && (
          <Link
            className="button button-outline"
            href={"/admin/duas/" + initial._id + "/preview"}
          >
            Preview
          </Link>
        )}
        <Link className="button button-ghost" href="/admin/duas">
          Cancel
        </Link>
      </div>
      {message && (
        <p role="status" className="small-note">
          {message}
        </p>
      )}
    </form>
  );
}
