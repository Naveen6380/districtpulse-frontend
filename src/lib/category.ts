// Category helpers that tolerate categories the backend adds later (e.g. "public_safety", "governance", "other").
// Labels always go through CATEGORY_LABEL first; unknown values get a readable fallback, never a guess.
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/format";

const LABELS = CATEGORY_LABEL as Record<string, string | undefined>;
const COLORS = CATEGORY_COLOR as Record<string, string | undefined>;

export function categoryLabel(c: string): string {
  return LABELS[c] ?? c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function categoryColor(c: string): string {
  return COLORS[c] ?? "var(--muted-foreground)";
}

/** Distinct categories present in the data, in CATEGORY_LABEL order first, then any new ones alphabetically. */
export function categoriesIn<T extends { category: string }>(rows: T[]): string[] {
  const present = new Set(rows.map((r) => r.category));
  const known = Object.keys(LABELS).filter((k) => present.has(k));
  const extra = [...present].filter((k) => !(k in LABELS)).sort();
  return [...known, ...extra];
}

export const categoryOptions = <T extends { category: string }>(rows: T[]) =>
  categoriesIn(rows).map((c) => ({ value: c, label: categoryLabel(c) }));
