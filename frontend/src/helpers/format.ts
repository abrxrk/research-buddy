import type { PaperStatus } from "@/types";

export const STATUS_LABEL: Record<PaperStatus, string> = {
  queued: "Queued",
  downloading: "Downloading",
  parsing: "Parsing PDF",
  embedding: "Indexing",
  analyzing: "Analysing",
  ready: "Ready",
  failed: "Failed",
};

/** Rough pipeline progress for the progress bar. */
export const STATUS_PROGRESS: Record<PaperStatus, number> = {
  queued: 6,
  downloading: 20,
  parsing: 40,
  embedding: 62,
  analyzing: 82,
  ready: 100,
  failed: 100,
};

export const isProcessing = (s: PaperStatus) => s !== "ready" && s !== "failed";
/** Q&A works once chunks are indexed, i.e. while analysis still runs. */
export const canChat = (s: PaperStatus) => s === "analyzing" || s === "ready";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(iso: string): string {
  // backend sends naive UTC timestamps
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  const sec = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, s] of units) if (Math.abs(sec) >= s) return rtf.format(Math.round(sec / s), unit);
  return "just now";
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
