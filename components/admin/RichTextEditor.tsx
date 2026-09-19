"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import { useState } from "react";
import { IlmBanglaLoader } from "@/components/ui/IlmBanglaLoader";

const pasteTags = new Set([
  "P",
  "BR",
  "H2",
  "H3",
  "H4",
  "STRONG",
  "EM",
  "U",
  "S",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "A",
  "HR",
  "CODE",
  "PRE",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "TD"
]);

function replaceTag(element: Element, tagName: string) {
  const replacement = element.ownerDocument.createElement(tagName);
  while (element.firstChild) replacement.append(element.firstChild);
  element.replaceWith(replacement);
  return replacement;
}

function wrapContents(element: Element, tagName: string) {
  const wrapper = element.ownerDocument.createElement(tagName);
  while (element.firstChild) wrapper.append(element.firstChild);
  element.append(wrapper);
}

// This improves Word/Docs paste fidelity and removes presentation markup.
// The server sanitizer remains the security boundary.
function cleanPastedHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  document
    .querySelectorAll(
      "script,style,iframe,object,embed,form,input,img,svg,canvas,video,audio"
    )
    .forEach((node) => node.remove());

  for (const original of Array.from(document.body.querySelectorAll("*"))) {
    if (!original.isConnected) continue;
    const style = original.getAttribute("style") ?? "";
    const className = original.getAttribute("class") ?? "";
    const href = original.getAttribute("href")?.trim() ?? "";
    const cellAttributes = Object.fromEntries(
      ["colspan", "rowspan", "scope"].map((name) => [
        name,
        original.getAttribute(name)
      ])
    );
    let element = original;

    const headingMatch =
      className.match(/(?:Mso)?Heading\s*([2-4])/i) ??
      style.match(/mso-outline-level\s*:\s*([2-4])/i);
    if (headingMatch && !/^H[2-4]$/.test(element.tagName))
      element = replaceTag(element, `h${headingMatch[1]}`);

    if (/font-weight\s*:\s*(?:bold|[6-9]00)/i.test(style))
      wrapContents(element, "strong");
    if (/font-style\s*:\s*italic/i.test(style)) wrapContents(element, "em");
    if (/text-decoration(?:-line)?\s*:[^;]*underline/i.test(style))
      wrapContents(element, "u");

    const attributes = Array.from(element.attributes);
    for (const attribute of attributes) element.removeAttribute(attribute.name);

    if (element.tagName === "A") {
      if (/^(https?:|mailto:|\/|#)/i.test(href))
        element.setAttribute("href", href);
    }
    if (element.tagName === "TH" || element.tagName === "TD") {
      for (const name of ["colspan", "rowspan", "scope"]) {
        const value = cellAttributes[name];
        if (value) element.setAttribute(name, value);
      }
    }

    if (element.tagName === "DIV") element = replaceTag(element, "p");
    if (!pasteTags.has(element.tagName))
      element.replaceWith(...element.childNodes);
  }
  return document.body.innerHTML;
}

function ToolbarButton({
  editor,
  label,
  title,
  active,
  disabled = false,
  onClick
}: {
  editor: Editor;
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rich-toolbar-button"
      aria-label={title}
      aria-pressed={active === undefined ? undefined : active}
      title={title}
      disabled={disabled}
      onClick={() => {
        onClick();
        editor.commands.focus();
      }}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  content,
  language,
  wordCount,
  statusText,
  statusReady,
  onChange,
  onNotice
}: {
  content: string;
  language: string;
  wordCount: number;
  statusText: string;
  statusReady: boolean;
  onChange: (html: string) => void;
  onNotice: (message: string) => void;
}) {
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: { rel: "noopener noreferrer" }
        }
      }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({
        placeholder:
          "Write your article, or paste formatted content from Word or Google Docs…"
      })
    ],
    content,
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        role: "textbox",
        "aria-label": "Article content",
        "aria-multiline": "true",
        lang: language
      },
      transformPastedHTML: (html) => {
        if (/<img\b/i.test(html))
          onNotice(
            "Pasted images were removed. Use the featured-image uploader instead."
          );
        return cleanPastedHtml(html);
      },
      handlePaste: (_view, event) => {
        const hasImage = Array.from(event.clipboardData?.files ?? []).some(
          (file) => file.type.startsWith("image/")
        );
        const hasText = Boolean(
          event.clipboardData?.getData("text/html") ||
          event.clipboardData?.getData("text/plain")
        );
        if (hasImage && !hasText) {
          onNotice(
            "Pasted images are not accepted. Use the featured-image uploader instead."
          );
          return true;
        }
        return false;
      }
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML())
  });

  if (!editor)
    return <IlmBanglaLoader variant="section" label="Loading editor" />;
  const activeEditor = editor;

  const heading = editor.isActive("heading", { level: 2 })
    ? "2"
    : editor.isActive("heading", { level: 3 })
      ? "3"
      : editor.isActive("heading", { level: 4 })
        ? "4"
        : "paragraph";
  const inTable = editor.isActive("table");

  function applyLink() {
    const value = linkUrl.trim();
    if (!value) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      setShowLink(false);
      return;
    }
    if (!/^(https?:\/\/|mailto:|\/|#)/i.test(value)) {
      onNotice("Links must use http, https, mailto, /, or #.");
      return;
    }
    activeEditor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: value })
      .run();
    setShowLink(false);
  }

  return (
    <div className="rich-editor-shell">
      <div
        className="rich-editor-toolbar"
        role="toolbar"
        aria-label="Article formatting"
      >
        <label className="rich-heading-control">
          <span>Style</span>
          <select
            aria-label="Text style"
            value={heading}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "paragraph")
                editor.chain().focus().setParagraph().run();
              else
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: Number(value) as 2 | 3 | 4 })
                  .run();
            }}
          >
            <option value="paragraph">Paragraph</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
          </select>
        </label>
        <span className="rich-toolbar-group" aria-label="Inline formatting">
          <ToolbarButton
            editor={editor}
            label="B"
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            editor={editor}
            label="I"
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            editor={editor}
            label="U"
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
          <ToolbarButton
            editor={editor}
            label="S"
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
          <ToolbarButton
            editor={editor}
            label="Code"
            title="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />
        </span>
        <span className="rich-toolbar-group" aria-label="Block formatting">
          <ToolbarButton
            editor={editor}
            label="• List"
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            editor={editor}
            label="1. List"
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            editor={editor}
            label="Quote"
            title="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            editor={editor}
            label="Code block"
            title="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />
          <ToolbarButton
            editor={editor}
            label="—"
            title="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
        </span>
        <span className="rich-toolbar-group" aria-label="Links and history">
          <ToolbarButton
            editor={editor}
            label="Link"
            title="Create or edit link"
            active={editor.isActive("link")}
            onClick={() => {
              setLinkUrl(String(editor.getAttributes("link").href ?? ""));
              setShowLink(true);
            }}
          />
          <ToolbarButton
            editor={editor}
            label="Undo"
            title="Undo"
            disabled={!editor.can().chain().focus().undo().run()}
            onClick={() => editor.chain().focus().undo().run()}
          />
          <ToolbarButton
            editor={editor}
            label="Redo"
            title="Redo"
            disabled={!editor.can().chain().focus().redo().run()}
            onClick={() => editor.chain().focus().redo().run()}
          />
        </span>
      </div>

      {showLink && (
        <div className="rich-link-controls">
          <label>
            Link URL
            <input
              type="url"
              value={linkUrl}
              placeholder="https://example.com"
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
                if (event.key === "Escape") setShowLink(false);
              }}
            />
          </label>
          <button
            type="button"
            className="button button-outline"
            onClick={applyLink}
          >
            Apply link
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              setShowLink(false);
            }}
          >
            Remove link
          </button>
        </div>
      )}

      <div
        className="rich-table-toolbar"
        role="toolbar"
        aria-label="Table controls"
      >
        <ToolbarButton
          editor={editor}
          label="Insert table"
          title="Insert a 3 by 3 table with a header row"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        />
        <ToolbarButton
          editor={editor}
          label="+ Row"
          title="Add row after"
          disabled={!inTable}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        />
        <ToolbarButton
          editor={editor}
          label="− Row"
          title="Delete current row"
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteRow().run()}
        />
        <ToolbarButton
          editor={editor}
          label="+ Column"
          title="Add column after"
          disabled={!inTable}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        />
        <ToolbarButton
          editor={editor}
          label="− Column"
          title="Delete current column"
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteColumn().run()}
        />
        <ToolbarButton
          editor={editor}
          label="Header"
          title="Toggle header row"
          disabled={!inTable}
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        />
        <ToolbarButton
          editor={editor}
          label="Delete table"
          title="Delete table"
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteTable().run()}
        />
      </div>
      <EditorContent editor={editor} />
      <div className="rich-editor-statusbar">
        <span>Word count: {wordCount}</span>
        <span className={statusReady ? "is-ready" : ""}>
          <span aria-hidden="true">{statusReady ? "●" : "○"}</span>
          {statusText}
        </span>
      </div>
    </div>
  );
}
