"use client";
import { Button } from "@/components/ui/Button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="auth-shell">
      <h1>Something went wrong</h1>
      <p>We could not load this page. Please try again.</p>
      <div style={{ textAlign: "center" }}>
        <Button variant="green" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
