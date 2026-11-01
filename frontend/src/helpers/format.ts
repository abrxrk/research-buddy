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
