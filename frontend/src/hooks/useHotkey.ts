"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const noop = () => () => {};
const isMacNow = () => /Mac|iPhone|iPad/.test(navigator.platform);

/** True on Apple platforms, false during SSR (so no hydration mismatch). */
export const useIsMac = () => useSyncExternalStore(noop, isMacNow, () => false);

const KEY_LABEL: Record<string, string> = {
  mod: "⌘", meta: "⌘", ctrl: "Ctrl", alt: "⌥", shift: "⇧",
  enter: "↵", escape: "Esc", esc: "Esc", backspace: "⌫", delete: "⌦", tab: "⇥",
  arrowup: "↑", arrowdown: "↓", arrowleft: "←", arrowright: "→", space: "Space", " ": "Space",
};

/** "mod+k" -> "⌘K" (Mac) / "Ctrl K" (other). "shift+/" -> "⇧/". Used by <Kbd combo>. */
export function formatCombo(combo: string, mac: boolean): string {
  const parts = combo.toLowerCase().split("+").map((k) => {
    if (k === "mod") return mac ? "⌘" : "Ctrl";
    if (k === "alt") return mac ? "⌥" : "Alt";
    return KEY_LABEL[k] ?? (k.length === 1 ? k.toUpperCase() : k[0].toUpperCase() + k.slice(1));
  });
  return parts.join(mac ? "" : " ");
}

/** True when the target takes text: contenteditable, textarea, select or a text-like input (not checkbox/radio/button). */
export const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    (t instanceof HTMLInputElement && !/^(checkbox|radio|button|submit|range|file)$/.test(t.type)));

export function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+");
  const key = parts.pop()!;
  const mac = isMacNow();
  const wantMeta = parts.includes("meta") || (parts.includes("mod") && mac);
  const wantCtrl = parts.includes("ctrl") || (parts.includes("mod") && !mac);
  if (e.metaKey !== wantMeta || e.ctrlKey !== wantCtrl || e.altKey !== parts.includes("alt")) return false;
  const k = e.key.toLowerCase();
  // printable keys already reflect Shift in e.key ("?" vs "/"); only named keys need an explicit check
  if (k.length > 1 && e.shiftKey !== parts.includes("shift")) return false;
  return k === key || (key === "space" && k === " ") || (key === "esc" && k === "escape");
}

type Options = {
  enabled?: boolean;
  /** Fire even while the user is typing in an input/textarea (default false; "escape" always fires). */
  allowInInput?: boolean;
};

/**
 * Global keyboard shortcut. combo: "mod+k", "/", "escape", "shift+?", "j", "alt+arrowdown".
 *   useHotkey("mod+k", () => searchRef.current?.focus());
 * Ignored while typing in inputs unless allowInInput. Calls preventDefault when it fires.
 */
export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void, { enabled = true, allowInInput = false }: Options = {}) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      if (!allowInInput && e.key !== "Escape" && isTyping(e.target)) return;
      if (!matchesCombo(e, combo)) return;
      e.preventDefault();
      ref.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, enabled, allowInInput]);
}
