"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  ImageIcon,
  Link2,
  Save,
  Search,
  Send,
  Settings2,
  Tags,
  Upload,
  X
} from "lucide-react";
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
  status?: "draft" | "published" | "archived";
  language?: string;
  featured?: boolean;
  featuredImage?: string;
  seoTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
};

function textFromContent(content: string, format: "plain" | "rich-html") {
  return (format === "rich-html" ? content.replace(/<[^>]*>/g, " ") : content)
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, values) => values.indexOf(tag) === index)
    .slice(0, 12);
}

function canPreviewImage(value: string) {
  return (
    /^\/images\/[\w./-]+$/.test(value) ||
    /^\/api\/media\/[a-f0-9]{24}$/.test(value) ||
    /^https:\/\/res\.cloudinary\.com\//.test(value) ||
    /^https:\/\/images\.pexels\.com\//.test(value) ||
    /^https:\/\/i\.ibb\.co\//.test(value)
  );
}

function EditorCard({
  icon,
  title,
  children
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="article-editor-card">
      <h2>
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

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
  const [dirty, setDirty] = useState(!initial._id);
  const [busyAction, setBusyAction] = useState<"save" | "upload" | null>(null);
  const busy = busyAction !== null;
  const [image, setImage] = useState(initial.featuredImage ?? "");
  const [imageMode, setImageMode] = useState<"upload" | "url">(
    initial.featuredImage?.startsWith("http") ? "url" : "upload"
  );
  const [language, setLanguage] = useState(initial.language ?? "en");
  const [title, setTitle] = useState(initial.title ?? "");
  const [slug, setSlug] = useState(
    initial.slug ?? slugify(initial.title ?? "")
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initial.slug)
  );
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [tagValue, setTagValue] = useState(initial.tags?.join(", ") ?? "");
  const [status, setStatus] = useState<ArticleData["status"]>(
    initial.status ?? "draft"
  );
  const [featured, setFeatured] = useState(Boolean(initial.featured));
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initial.metaDescription ?? ""
  );
  const originalPlainContent = initial.content ?? "";
  const [content, setContent] = useState(originalPlainContent);
  const [contentFormat, setContentFormat] = useState<"plain" | "rich-html">(
    initial.contentFormat === "rich-html" || !initial._id
      ? "rich-html"
      : "plain"
  );
  const [converted, setConverted] = useState(false);
  const selectedTags = useMemo(() => splitTags(tagValue), [tagValue]);
  const contentText = useMemo(
    () => textFromContent(content, contentFormat),
    [content, contentFormat]
  );
  const wordCount = contentText ? contentText.split(/\s+/).length : 0;
  const readyToSave =
    title.trim().length >= 5 &&
    Boolean(slug) &&
    excerpt.trim().length >= 20 &&
    category.trim().length >= 2 &&
    contentText.length >= 50;
  const editorStatus = busy
    ? "Saving changes…"
    : readyToSave
      ? dirty
        ? "Ready to save"
        : "Saved version loaded"
      : "Complete the required fields";
  const previewHref = initial._id
    ? `/admin/articles/${initial._id}/preview`
    : "";

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
      const raw = Object.fromEntries(form) as Record<
        string,
        FormDataEntryValue
      >;
      const submitIntent = String(raw.submitIntent ?? "save");
      delete raw.submitIntent;
      const data = {
        ...raw,
        status: submitIntent === "draft" ? "draft" : status,
        content,
        contentFormat,
        featuredImage: image,
        tags: selectedTags,
        featured
      };
      await requestJson(
        initial._id ? "/api/articles/" + initial._id : "/api/articles",
        { method: initial._id ? "PATCH" : "POST", body: JSON.stringify(data) }
      );
      setDirty(false);
      router.push("/admin/articles");
      router.refresh();
    } catch (error) {
      setMessage((error as Error).message);
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
      setDirty(true);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusyAction(null);
    }
  }

  function toggleTag(tag: string) {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag].slice(0, 12);
    setTagValue(nextTags.join(", "));
    setDirty(true);
  }

  return (
    <div className="article-editor-page">
      <header className="article-editor-header">
        <div>
          <p className="article-editor-breadcrumb">
            Articles <span aria-hidden="true">/</span>{" "}
            {initial._id ? "Edit Article" : "Create New Article"}
          </p>
          <h1>Article Editor</h1>
          <p>Write, enrich and share beneficial knowledge with your readers.</p>
        </div>
        <Link className="button button-outline" href="/admin/articles">
          <ArrowLeft size={16} /> Back to Articles
        </Link>
      </header>

      <form
        action={save}
        className="article-editor-form"
        onChange={() => setDirty(true)}
      >
        <main className="article-editor-main">
          <section className="article-editor-card article-editor-writing-card">
            <fieldset className="article-editor-language">
              <legend>Language</legend>
              <label>
                <input
                  type="radio"
                  name="language"
                  value="bn"
                  checked={language === "bn"}
                  onChange={() => setLanguage("bn")}
                />
                বাংলা
              </label>
              <label>
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={language === "en"}
                  onChange={() => setLanguage("en")}
                />
                English
              </label>
            </fieldset>

            <div className="article-editor-title-grid">
              <label className="editor-field">
                <span>
                  Title <b aria-hidden="true">*</b>
                  <small>{title.length}/180</small>
                </span>
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
              <label className="editor-field">
                <span>
                  Slug <b aria-hidden="true">*</b>
                </span>
                <div className="article-editor-slug-input">
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
                  <Link2 size={15} aria-hidden="true" />
                </div>
                <small>/articles/{slug || "article-url-slug"}</small>
              </label>
            </div>

            <label className="editor-field">
              <span>
                Excerpt <b aria-hidden="true">*</b>
                <small>{excerpt.length}/400</small>
              </span>
              <textarea
                name="excerpt"
                lang={language}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                required
                minLength={20}
                maxLength={400}
                rows={4}
              />
            </label>

            <div className="article-editor-content-heading">
              <span>
                Content <b aria-hidden="true">*</b>
              </span>
              <small>
                <FileText size={14} /> Supports formatted paste from Word and
                Google Docs
              </small>
            </div>

            {contentFormat === "plain" ? (
              <>
                <textarea
                  className="editor-body"
                  aria-label="Article content"
                  lang={language}
                  value={content}
                  required
                  minLength={50}
                  maxLength={100000}
                  onChange={(event) => {
                    setContent(event.target.value);
                    setDirty(true);
                  }}
                />
                <div className="rich-editor-statusbar">
                  <span>Word count: {wordCount}</span>
                  <span className={readyToSave ? "is-ready" : ""}>
                    {readyToSave && <CheckCircle2 size={14} />}
                    {editorStatus}
                  </span>
                </div>
              </>
            ) : (
              <RichTextEditor
                key={`${initial._id ?? "new"}-${contentFormat}`}
                content={content}
                language={language}
                wordCount={wordCount}
                statusText={editorStatus}
                statusReady={readyToSave}
                onChange={(value) => {
                  setContent(value);
                  setDirty(true);
                }}
                onNotice={setMessage}
              />
            )}

            <p className="article-editor-sanitizing-note">
              Formatting is cleaned before saving. Source fonts, colors,
              classes, inline styles and pasted images are not stored.
            </p>
          </section>

          {contentFormat === "plain" && (
            <section className="legacy-editor-notice article-editor-convert">
              <div>
                <strong>Convert from plain text (old articles)</strong>
                <p className="small-note">
                  Convert legacy headings and sourced reference blocks to rich
                  text before saving.
                </p>
              </div>
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setContent(plainArticleToRichHtml(content));
                  setContentFormat("rich-html");
                  setConverted(true);
                  setDirty(true);
                  setMessage(
                    "Converted in the editor only. Review the formatting before saving."
                  );
                }}
              >
                Convert to Rich Text
              </button>
            </section>
          )}

          {converted && contentFormat === "rich-html" && (
            <section className="legacy-editor-notice article-editor-convert">
              <div>
                <strong>Plain text converted for review</strong>
                <p className="small-note">
                  The saved article remains unchanged until you update it.
                </p>
              </div>
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
            </section>
          )}
        </main>

        <aside className="article-editor-sidebar">
          <EditorCard
            icon={<Settings2 size={18} />}
            title="Publishing Settings"
          >
            <label className="editor-field">
              <span>Status</span>
              <select
                name="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ArticleData["status"])
                }
              >
                <option value="draft">Draft / unpublished</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <small>Choose the publication status.</small>
            </label>
            <label className="article-editor-feature-toggle">
              <span>
                <strong>Featured article</strong>
                <small>Show this article in featured sections.</small>
              </span>
              <input
                type="checkbox"
                name="featured"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
              />
            </label>
            {initial.publishedAt && (
              <div className="article-editor-published-at">
                <Clock3 size={15} />
                <span>
                  <strong>Published</strong>
                  <time dateTime={initial.publishedAt}>
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(new Date(initial.publishedAt))}
                  </time>
                </span>
              </div>
            )}
          </EditorCard>

          <EditorCard icon={<Tags size={18} />} title="Category & Tags">
            <label className="editor-field">
              <span>
                Category <b aria-hidden="true">*</b>
              </span>
              <input
                name="category"
                list="article-categories"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                minLength={2}
                maxLength={80}
              />
              <datalist id="article-categories">
                {categories.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>
            <label className="editor-field">
              <span>Tags</span>
              <input
                name="tags"
                value={tagValue}
                onChange={(event) => setTagValue(event.target.value)}
                placeholder="Add tags separated by commas"
              />
              <small>Use commas to separate up to 12 tags.</small>
            </label>
            {!!selectedTags.length && (
              <div
                className="article-editor-tag-list"
                aria-label="Selected tags"
              >
                {selectedTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    title={`Remove ${tag}`}
                  >
                    {tag} <X size={12} />
                  </button>
                ))}
              </div>
            )}
            {!!tags.length && (
              <div className="article-editor-tag-suggestions">
                <small>Existing tags</small>
                <div>
                  {tags
                    .filter((tag) => !selectedTags.includes(tag))
                    .slice(0, 8)
                    .map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </EditorCard>

          <EditorCard icon={<ImageIcon size={18} />} title="Featured Image">
            <div className="article-editor-image-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={imageMode === "upload"}
                onClick={() => setImageMode("upload")}
              >
                Upload
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={imageMode === "url"}
                onClick={() => setImageMode("url")}
              >
                Use URL
              </button>
            </div>
            {imageMode === "upload" ? (
              <label className="article-editor-upload">
                <Upload size={24} />
                <strong>Choose an image</strong>
                <small>PNG, JPEG or WebP · max 5 MB</small>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={busy}
                  onChange={(event) => upload(event.target.files?.[0])}
                />
              </label>
            ) : (
              <label className="editor-field">
                <span>Direct image URL</span>
                <input
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  placeholder="https://i.ibb.co/..."
                />
                <small>Supports Pexels, Cloudinary and ImgBB HTTPS URLs.</small>
              </label>
            )}
            {busyAction === "upload" && (
              <IlmBanglaLoader variant="inline" label="Uploading image" />
            )}
            {image && canPreviewImage(image) && (
              <div className="article-editor-image-preview">
                <Image
                  src={image}
                  alt="Featured image preview"
                  fill
                  sizes="320px"
                />
                <button
                  type="button"
                  aria-label="Remove featured image"
                  title="Remove featured image"
                  onClick={() => {
                    setImage("");
                    setDirty(true);
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            )}
            {image && !canPreviewImage(image) && (
              <p className="small-note">
                Enter an approved image URL to see the preview.
              </p>
            )}
          </EditorCard>

          <EditorCard
            icon={<Search size={18} />}
            title="SEO (Search Engine Optimization)"
          >
            <label className="editor-field">
              <span>
                SEO title <small>{seoTitle.length}/70</small>
              </span>
              <input
                name="seoTitle"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                maxLength={70}
              />
            </label>
            <label className="editor-field">
              <span>
                Meta description <small>{metaDescription.length}/170</small>
              </span>
              <textarea
                name="metaDescription"
                value={metaDescription}
                onChange={(event) => setMetaDescription(event.target.value)}
                maxLength={170}
                rows={4}
              />
            </label>
          </EditorCard>
        </aside>

        <footer className="article-editor-actions">
          <div>
            {message ? (
              <p role="alert" className="form-error">
                {message}
              </p>
            ) : (
              <p className={readyToSave ? "is-ready" : ""}>
                {readyToSave && <CheckCircle2 size={15} />}
                {editorStatus}
              </p>
            )}
          </div>
          <div className="article-editor-action-buttons">
            {previewHref ? (
              <Link
                className="button button-outline"
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye size={16} /> Preview
              </Link>
            ) : (
              <button
                type="button"
                className="button button-outline"
                disabled
                title="Save the article once to enable preview."
              >
                <Eye size={16} /> Preview
              </button>
            )}
            <button
              type="submit"
              className="button button-outline"
              name="submitIntent"
              value="draft"
              disabled={busy}
            >
              <Save size={16} /> Save Draft
            </button>
            <button
              type="submit"
              className="button button-green"
              name="submitIntent"
              value="save"
              disabled={busy}
            >
              {busyAction === "save" ? (
                <IlmBanglaLoader variant="inline" label="Saving" />
              ) : (
                <>
                  <Send size={16} />
                  {initial._id
                    ? "Update article"
                    : status === "published"
                      ? "Publish"
                      : "Save article"}
                </>
              )}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
