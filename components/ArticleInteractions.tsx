"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";
import { requestJson } from "@/lib/client";
import { ArticleShare } from "@/components/ArticleShare";
type State = {
  likes: number;
  liked: boolean;
  saved: boolean;
  comments: Array<{
    id: string;
    name: string;
    body: string;
    createdAt: string;
  }>;
};
export function ArticleInteractions({
  articleId,
  loggedIn,
  title,
  children
}: {
  articleId: string;
  loggedIn: boolean;
  title: string;
  children?: ReactNode;
}) {
  const [state, setState] = useState<State>({
    likes: 0,
    liked: false,
    saved: false,
    comments: []
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const endpoint = "/api/articles/" + articleId + "/interactions";
  useEffect(() => {
    let active = true;
    requestJson<State>(endpoint)
      .then((data) => {
        if (active) setState(data);
      })
      .catch(() => {
        if (active)
          setMessage("Unable to load comments. Please refresh to retry.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    fetch("/api/articles/" + articleId + "/view", { method: "POST" }).catch(
      () => {}
    );
    return () => {
      active = false;
    };
  }, [endpoint, articleId]);
  async function toggle(action: "bookmark" | "like") {
    setBusy(true);
    setMessage("");
    try {
      setState(
        await requestJson<State>(endpoint, {
          method: (action === "bookmark" ? state.saved : state.liked)
            ? "DELETE"
            : "PUT",
          body: JSON.stringify({ action })
        })
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function comment() {
    setBusy(true);
    setMessage("");
    try {
      const data = await requestJson<{ message: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify({ body })
      });
      setMessage(data.message);
      setBody("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="article-interactions">
      <div className="article-engagement" aria-label="Article interactions">
        <div className="action-row">
          {loggedIn ? (
            <>
              <button
                className="button button-outline"
                disabled={busy || loading}
                aria-pressed={state.saved}
                onClick={() => toggle("bookmark")}
              >
                <Bookmark size={17} />
                {state.saved ? "Saved — remove" : "Save article"}
              </button>
              <button
                className="button button-outline"
                disabled={busy || loading}
                aria-pressed={state.liked}
                onClick={() => toggle("like")}
              >
                <Heart size={17} />
                {state.liked ? "Liked" : "Like"} · {loading ? "…" : state.likes}
              </button>
            </>
          ) : (
            <>
              <Link className="button button-outline" href="/login">
                Log in to save or like
              </Link>
              <span className="small-note">
                {loading ? "Loading likes…" : state.likes + " likes"}
              </span>
            </>
          )}
        </div>
        <ArticleShare title={title} />
      </div>
      {children}
      <section
        className="comments"
        aria-labelledby="comments-title"
        aria-busy={loading}
      >
        <h2 id="comments-title">
          Comments{!loading && " (" + state.comments.length + ")"}
        </h2>
        <p className="small-note">
          Keep it thoughtful and respectful. Comments are reviewed before
          appearing.
        </p>
        {loggedIn ? (
          <form action={comment} className="form-stack">
            <label>
              Your comment
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                minLength={3}
                maxLength={3000}
                rows={3}
                placeholder="Write your comment…"
              />
            </label>
            <div className="comment-submit">
              <button className="button button-green" disabled={busy}>
                Submit for review
              </button>
            </div>
          </form>
        ) : (
          <p>
            <Link className="text-link" href="/login">
              Log in to comment
            </Link>
          </p>
        )}
        {message && (
          <p role="status" className="small-note">
            {message}
          </p>
        )}
        {loading ? (
          <p className="small-note">Loading comments…</p>
        ) : state.comments.length ? (
          state.comments.map((c) => (
            <article className="comment" key={c.id}>
              <span className="reader-avatar" aria-hidden="true">
                {Array.from(c.name)[0]}
              </span>
              <div className="comment-copy">
                <strong>{c.name}</strong>
                <small>
                  {" "}
                  · {new Date(c.createdAt).toLocaleDateString("en")}
                </small>
                <p dir="auto">{c.body}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="small-note">No published comments yet.</p>
        )}
      </section>
    </div>
  );
}
