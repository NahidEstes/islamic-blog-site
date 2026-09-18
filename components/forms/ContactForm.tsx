"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IlmBanglaLoader } from "@/components/ui/IlmBanglaLoader";

export function ContactForm() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      const data = await response.json();
      setStatus(data.message);
      setPending(false);
    } catch {
      setStatus("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form action={submit} className="panel form-stack">
      <div className="form-row">
        <label>
          Name
          <input name="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
      </div>
      <label>
        Subject
        <input name="subject" required />
      </label>
      <label>
        Message
        <textarea name="message" rows={7} minLength={20} required />
      </label>
      {status && <p role="status">{status}</p>}
      <Button variant="green" disabled={pending}>
        {pending ? (
          <IlmBanglaLoader variant="inline" label="Sending" />
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
