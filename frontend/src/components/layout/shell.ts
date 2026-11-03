import { truncate } from "@/helpers/format";
import type { Comparison, PaperStatus } from "@/types";

/** "BERT: Pre-training of… vs Attention Is All You Need" — for the palette and document.title. */
export const comparisonLabel = (c: Comparison, per = 32) => c.titles.map((t) => truncate(t, per)).join(" vs ");

/** Sidebar row: first title on line one, "vs <second> (+n)" on line two, so both papers are readable. */
export const comparisonLines = (c: Comparison) => ({
  title: c.titles[0] ?? "Comparison",
  sub: c.titles.length > 1 ? `vs ${c.titles[1]}${c.titles.length > 2 ? ` +${c.titles.length - 2}` : ""}` : undefined,
});

/**
 * Shell state that must outlive a page change. AppShell is mounted per page, so React state
 * resets on every navigation; these module values don't.
 * ponytail: module-level instead of a store; move to zustand if anything outside the shell needs them.
 */
export const sectionOpen: Record<string, boolean> = { Papers: true, Comparisons: true };
export const lastStatus = new Map<string, PaperStatus>();

const ADD_PAPER_INPUT = 'section[aria-label="Add a paper"] input:not([type="file"])';

/** Focus the add-paper field on the dashboard. Returns false when the field isn't on the page (yet). */
export function focusAddPaper(): boolean {
  const el = document.querySelector<HTMLInputElement>(ADD_PAPER_INPUT);
  el?.focus();
  return !!el;
}

/** Try focusing for ~1s after navigating to the dashboard (the page renders after hydration). */
export function focusAddPaperSoon() {
  // ponytail: polling the DOM instead of a shared store flag; swap for a store if more pages need it
  let tries = 20;
  const id = setInterval(() => {
    if (focusAddPaper() || --tries <= 0) clearInterval(id);
  }, 50);
}

export type ShortcutGroup = "Everywhere" | "Library" | "Paper and comparison" | "Chat";

export const SHORTCUTS: { group: ShortcutGroup; keys: string[]; label: string }[] = [
  { group: "Everywhere", keys: ["mod+k"], label: "Search papers, comparisons and actions" },
  { group: "Everywhere", keys: ["alt+arrowdown", "alt+arrowup"], label: "Next / previous paper" },
  { group: "Everywhere", keys: ["?"], label: "Show keyboard shortcuts" },
  { group: "Everywhere", keys: ["escape"], label: "Close dialogs and menus" },
  { group: "Library", keys: ["/"], label: "Search the library" },
  { group: "Library", keys: ["j", "k"], label: "Move down / up" },
  { group: "Library", keys: ["enter"], label: "Open the highlighted paper" },
  { group: "Library", keys: ["x"], label: "Select for comparison" },
  { group: "Library", keys: ["backspace"], label: "Delete the highlighted paper" },
  { group: "Library", keys: ["mod+v"], label: "Paste a link to add a paper" },
  { group: "Paper and comparison", keys: ["1 – 5"], label: "Switch tab" },
  { group: "Paper and comparison", keys: ["/"], label: "Filter results or find a concept" },
  { group: "Paper and comparison", keys: ["f"], label: "Concept map: full screen" },
  { group: "Paper and comparison", keys: ["0"], label: "Concept map: fit to view" },
  { group: "Paper and comparison", keys: ["=", "-"], label: "Concept map: zoom in / out" },
  { group: "Chat", keys: ["mod+j"], label: "Focus the chat box" },
  { group: "Chat", keys: ["enter"], label: "Send a question" },
  { group: "Chat", keys: ["shift+enter"], label: "New line" },
];
