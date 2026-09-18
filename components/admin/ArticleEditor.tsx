"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson } from "@/lib/client";
import { plainArticleToRichHtml } from "@/lib/article-content";
import { slugify } from "@/lib/utils";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { IlmBanglaLoader } from "@/components/ui/IlmBanglaLoader";
type ArticleData = {
  _id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  contentFormat?: "plain" | "rich-html";
  category?: string;
  tags?: string[];
  status?: string;
  language?: string;
  featured?: boolean;
  featuredImage?: string;
  seoTitle?: string;
  metaDescription?: string;
};
export function ArticleEditor({
  initial = {},
  categories = [],
  tags = []
}: {
  initial?: ArticleData;
  categories?: string[];
  tags?: string[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<"save" | "upload" | null>(null);
  const busy = busyAction !== null;
  const [image, setImage] = useState(initial.featuredImage ?? "");
  const [language, setLanguage] = useState(initial.language ?? "en");
  const [title, setTitle] = useState(initial.title ?? "");
  const [slug, setSlug] = useState(
    initial.slug ?? slugify(initial.title ?? "")
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initial.slug)
  );
  const originalPlainContent = initial.content ?? "";
  const [content, setContent] = useState(originalPlainContent);
  const [contentFormat, setContentFormat] = useState<"plain" | "rich-html">(
    initial.contentFormat === "rich-html" || !initial._id
      ? "rich-html"
      : "plain"
  );
  const [converted, setConverted] = useState(false);
  async function save(form: FormData) {
    setBusyAction("save");
    setMessage("");
    try {
      const visibleContent =
        contentFormat === "rich-html"
          ? (new DOMParser().parseFromString(content, "text/html").body
              .textContent ?? "")
          : content;
      if (visibleContent.replace(/\s+/g, " ").trim().length < 50)
        throw new Error(
          "Article content must contain at least 50 visible characters."
        );
      const data = {
        ...Object.fromEntries(form),
        content,
        contentFormat,
        featuredImage: image,
        tags: String(form.get("tags") ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        featured: form.has("featured")
      };
      await requestJson(
        initial._id ? "/api/articles/" + initial._id : "/api/articles",
        { method: initial._id ? "PATCH" : "POST", body: JSON.stringify(data) }
      );
      router.push("/admin/articles");
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusyAction(null);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusyAction("upload");
    setMessage("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: form
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setImage(data.url);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusyAction(null);
    }
  }
  return (
    <form action={save} className="panel form-stack">
      <label>
        Article language
        <select
          name="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="bn">Bangla</option>
        </select>
      </label>
      <label>
        Title
        <input
          name="title"
          lang={language}
          value={title}
          onChange={(event) => {
            const nextTitle = event.target.value;
            setTitle(nextTitle);
            if (!slugManuallyEdited) setSlug(slugify(nextTitle));
          }}
          required
          minLength={5}
          maxLength={180}
        />
      </label>
      <label>
        Slug
        <input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlug(slugify(event.target.value));
            setSlugManuallyEdited(true);
          }}
          required
          maxLength={180}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="article-url-slug"
        />
        <span className="small-note">
          Article URL: /articles/{slug || "article-url-slug"}
        </span>
      </label>
      <label>
        Excerpt
        <textarea
          name="excerpt"
          lang={language}
          defaultValue={initial.excerpt}
          required
          minLength={20}
          maxLength={400}
          rows={3}
        />
      </label>
      <label>
        Content format
        <span className="content-format-label">
          {contentFormat === "rich-html" ? "Rich text" : "Legacy plain text"}
        </span>
      </label>
      {contentFormat === "plain" ? (
        <>
          <label>
            Content
            <textarea
              className="editor-body"
              lang={language}
              value={content}
              required
              minLength={50}
              maxLength={100000}
              onChange={(event) => setContent(event.target.value)}
            />
          </label>
          <div className="legacy-editor-notice">
            <div>
              <strong>
                This article still uses the legacy plain-text format.
              </strong>
              <p className="small-note">
                Its existing ## headings and &gt; reference blocks will keep
                rendering exactly as before.
              </p>
            </div>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                setContent(plainArticleToRichHtml(content));
                setContentFormat("rich-html");
                setConverted(true);
                setMessage(
                  "Converted in the editor only. Review the formatting before saving."
                );
              }}
            >
              Convert to rich text
            </button>
          </div>
          <p className="small-note">
            Separate paragraphs with a blank line. Start a heading with ##
            followed by a space. For a manually sourced quotation, start each
            line with &gt; and end the block with &gt; Source: followed by its
            reference.
          </p>
        </>
      ) : (
        <>
          <RichTextEditor
            key={`${initial._id ?? "new"}-${contentFormat}`}
            content={content}
            language={language}
            onChange={setContent}
            onNotice={setMessage}
          />
          <div className="rich-editor-note">
            <p className="small-note">
              Formatting is cleaned before saving. Source fonts, sizes, colors,
              backgrounds, classes, inline styles, and pasted images are not
              stored.
            </p>
            {converted && (
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  setContent(originalPlainContent);
                  setContentFormat("plain");
                  setConverted(false);
                  setMessage(
                    "Conversion cancelled. The saved article was not changed."
                  );
                }}
              >
                Cancel conversion
              </button>
            )}
          </div>
        </>
      )}
      <div className="form-row">
        <label>
          Category
          <input
            name="category"
            list="article-categories"
            defaultValue={initial.category}
            required
            minLength={2}
            maxLength={80}
          />
          <datalist id="article-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label>
          Tags (comma separated)
          <input
            name="tags"
            defaultValue={initial.tags?.join(", ")}
            placeholder={tags.slice(0, 3).join(", ")}
          />
        </label>
      </div>
      <label>
        Featured image URL
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://images.pexels.com/..."
        />
        <span className="small-note">
          Use an uploaded image, a /images/ path, or a direct Pexels,
          Cloudinary, or ImgBB HTTPS URL.
        </span>
      </label>
      <label>
        Or upload an image (PNG, JPEG, WebP; max 5 MB)
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </label>
      {busyAction === "upload" && (
        <p className="small-note">
          <IlmBanglaLoader variant="inline" label="Uploading image" />
        </p>
      )}
      {image && <p className="small-note">Image selected: {image}</p>}
      <div className="form-row">
        <label>
          Status
          <select name="status" defaultValue={initial.status ?? "draft"}>
            <option value="draft">Draft / unpublished</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          SEO title
          <input
            name="seoTitle"
            defaultValue={initial.seoTitle}
            maxLength={70}
          />
        </label>
      </div>
      <label>
        Meta description
        <textarea
          name="metaDescription"
          defaultValue={initial.metaDescription}
          maxLength={170}
          rows={2}
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={initial.featured}
        />{" "}
        Feature this article
      </label>
      {message && (
        <p role="alert" className="form-error">
          {message}
        </p>
      )}
      <div>
        <button className="button button-green" disabled={busy}>
          {busyAction === "save" ? (
            <IlmBanglaLoader variant="inline" label="Saving" />
          ) : (
            "Save article"
          )}
        </button>
      </div>
    </form>
  );
}
