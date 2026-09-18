"use client";

import { useState } from "react";
import { IlmBanglaLoader } from "@/components/ui/IlmBanglaLoader";

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function subscribe(formData: FormData) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") })
      });
      const data = await response.json();
      setMessage(
        data.message ?? (response.ok ? "Subscribed." : "Please try again.")
      );
      setPending(false);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={subscribe} className="newsletter-form">
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        placeholder="Your email address"
        required
      />
      <button disabled={pending}>
        {pending ? (
          <IlmBanglaLoader variant="inline" label="Joining" />
        ) : (
          "Subscribe"
        )}
      </button>
      {message && <small role="status">{message}</small>}
    </form>
  );
}
