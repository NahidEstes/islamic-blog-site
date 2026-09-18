import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type LoaderVariant = "fullPage" | "section" | "inline";

export function IlmBanglaLoader({
  variant = "section",
  label = "Loading",
  className
}: {
  variant?: LoaderVariant;
  label?: string;
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <span
        className={cn("ilm-loader-inline", className)}
        role="status"
        aria-live="polite"
      >
        <span className="ilm-loader-spinner" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div
      className={cn("ilm-loader", `ilm-loader-${variant}`, className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ilm-loader-arch" aria-hidden="true" />
      <div className="ilm-loader-content">
        <span className="ilm-loader-mark" aria-hidden="true">
          <BookOpen size={variant === "fullPage" ? 27 : 21} />
        </span>
        <strong className="ilm-loader-brand">Ilm Bangla</strong>
        {variant === "fullPage" && (
          <span className="ilm-loader-tagline">Seek · Learn · Practice</span>
        )}
        <span className="ilm-loader-spinner" aria-hidden="true" />
        <span className="ilm-loader-label">{label}…</span>
        {variant === "fullPage" && (
          <span className="ilm-loader-note">
            Good knowledge leads to a better you
          </span>
        )}
      </div>
    </div>
  );
}
