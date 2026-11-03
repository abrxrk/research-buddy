import type { ComparisonStatus, PaperStatus } from "@/types";

/** Plain-language status, shown next to every paper. */
export const STATUS_LABEL: Record<PaperStatus, string> = {
  queued: "Waiting to start",
  downloading: "Downloading the PDF",
  parsing: "Reading the PDF",
  embedding: "Indexing for search",
  analyzing: "Writing the summary",
  ready: "Ready",
  failed: "Failed",
};

/** Processing steps, in order. Used for "step 2 of 4". */
export const STEPS: PaperStatus[] = ["downloading", "parsing", "embedding", "analyzing"];

export const isProcessing = (s: PaperStatus | ComparisonStatus) => s !== "ready" && s !== "failed";

export const COMPARISON_LABEL: Record<ComparisonStatus, string> = {
  queued: "Waiting to start",
  briefing: "Reading each paper",
  synthesizing: "Comparing the papers",
  ready: "Ready",
  failed: "Failed",
};
/** Q&A works once chunks are indexed, i.e. while analysis still runs. */
export const canChat = (s: PaperStatus) => s === "analyzing" || s === "ready";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Backend sends naive UTC timestamps ("2025-01-02T03:04:05"); treat them as UTC. */
export const parseDate = (iso: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);

export function timeAgo(iso: string): string {
  const date = parseDate(iso);
  const sec = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, s] of units) if (Math.abs(sec) >= s) return rtf.format(Math.round(sec / s), unit);
  return "just now";
}

const abs = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
/** "2 Jan 2025, 15:04" in the user's locale and timezone. For tooltips on relative times. */
export const absoluteDate = (iso: string) => abs.format(parseDate(iso));

/** plural(3, "paper") -> "3 papers"; plural(1, "paper") -> "1 paper"; irregulars via the third arg. */
export const plural = (n: number, word: string, words = `${word}s`) => `${n} ${n === 1 ? word : words}`;

/** Short id for display: "6ae6f22729612ae121eba191" -> "6ae6f2". */
export const shortId = (id: string, len = 6) => id.slice(0, len);

/** Cut long text at a word boundary with an ellipsis. */
export function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6))}…`;
}

/** "comparison_with_baselines" -> "Comparison with baselines", "BLEU.EN-DE" -> "BLEU EN-DE". */
export function humanize(label: string): string {
  const s = label.replace(/[_.]+/g, " ").replace(/\s+/g, " ").trim();
  return s && s === s.toLowerCase() ? s[0].toUpperCase() + s.slice(1) : s;
}

/** A value that reads well as a big number ("28.4", "3.5 days", "+2.0 BLEU"), not a sentence. */
export const isHeadlineValue = (v: string | null): v is string => !!v && /\d/.test(v) && v.length <= 14;

/** Drop affiliations: "Ashish Vaswani (Google Brain)" -> "Ashish Vaswani". */
export const authorName = (a: string) => a.replace(/\s*\(.*?\)\s*/g, " ").trim();
