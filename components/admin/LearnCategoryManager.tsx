"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client";

type Category = {
  _id?: string;
  module?: string;
  name?: string;
  description?: string;
  order?: number;
  published?: boolean;
};
export function LearnCategoryManager({ initial }: { initial?: Category }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function save(form: FormData) {
    try {
      const body = {
        module: form.get("module"),
        name: form.get("name"),
        description: form.get("description"),
        order: Number(form.get("order")),
        published: form.get("published") === "on"
      };
      const data = await requestJson<{ message: string }>(
        initial?._id
          ? "/api/admin/learn-categories/" + initial._id
          : "/api/admin/learn-categories",
        {
          method: initial?._id ? "PATCH" : "POST",
          body: JSON.stringify(body)
        }
      );
      setMessage(data.message);
      router.refresh();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  async function remove() {
    if (!initial?._id || !confirm("Delete this learning category?")) return;
    try {
      await requestJson("/api/admin/learn-categories/" + initial._id, {
        method: "DELETE"
      });
      router.refresh();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  return (
    <form action={save} className="form-stack compact-form">
      <div className="form-row">
        <label>
          Module
          <select name="module" defaultValue={initial?.module ?? "duas"}>
            {[
              "duas",
              "quran",
              "hadith",
              "arabic-stories",
              "vocabulary",
              "practice"
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Order
          <input
            name="order"
            type="number"
            min="0"
            max="10000"
            defaultValue={initial?.order ?? 0}
          />
        </label>
      </div>
      <label>
        Name
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initial?.name}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          rows={2}
          maxLength={300}
          defaultValue={initial?.description}
        />
      </label>
      <label className="checkbox">
        <input
          name="published"
          type="checkbox"
          defaultChecked={initial?.published ?? true}
        />{" "}
        Published
      </label>
      <div className="action-row">
        <button className="button button-outline">Save category</button>
        {initial?._id && (
          <button
            className="button button-danger"
            type="button"
            onClick={remove}
          >
            Delete
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="small-note">
          {message}
        </p>
      )}
    </form>
  );
}
