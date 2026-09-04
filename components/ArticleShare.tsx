"use client";
import { useState } from "react";
import { Link2, MessageCircle } from "lucide-react";

export function ArticleShare({ title }: { title: string }) {
  const [message, setMessage] = useState("");
  function share(service: "facebook" | "x" | "whatsapp") {
    const url = encodeURIComponent(
      window.location.origin + window.location.pathname
    );
    const text = encodeURIComponent(title);
    const target =
      service === "facebook"
        ? "https://www.facebook.com/sharer/sharer.php?u=" + url
        : service === "x"
          ? "https://twitter.com/intent/tweet?url=" + url + "&text=" + text
          : "https://wa.me/?text=" + text + "%20" + url;
    window.open(target, "_blank", "noopener,noreferrer");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        window.location.origin + window.location.pathname
      );
      setMessage("Link copied.");
    } catch {
      setMessage("Could not copy. You can copy the address from your browser.");
    }
  }
  return (
    <div className="article-share">
      <span>Share:</span>
      <button
        type="button"
        onClick={() => share("facebook")}
        aria-label="Share on Facebook"
      >
        <span aria-hidden="true">f</span>
      </button>
      <button type="button" onClick={() => share("x")} aria-label="Share on X">
        X
      </button>
      <button
        type="button"
        onClick={() => share("whatsapp")}
        aria-label="Share on WhatsApp"
      >
        <MessageCircle size={17} />
      </button>
      <button type="button" onClick={copy} aria-label="Copy article link">
        <Link2 size={17} />
      </button>
      {message && (
        <span role="status" className="share-status">
          {message}
        </span>
      )}
    </div>
  );
}
