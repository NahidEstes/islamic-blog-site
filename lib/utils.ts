export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
export function slugify(value: string) {
  return value
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function decodeArticleSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
export function pageNumber(value?: string | null) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(10000, Math.max(1, Math.floor(n))) : 1;
}
