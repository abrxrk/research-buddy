"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  CornerDownLeft,
  GitCompareArrows,
  Keyboard,
  Library,
  LogOut,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DialogOverlay } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { COMPARISON_LABEL, isProcessing, STATUS_LABEL } from "@/helpers/format";
import { cn } from "@/lib/utils";
import { useComparisonStore } from "@/store/comparisonStore";
import { usePaperStore } from "@/store/paperStore";

import { comparisonLabel, focusAddPaper, focusAddPaperSoon } from "./shell";
import { StatusDot } from "./StatusDot";

type Item = {
  id: string;
  group: "Papers" | "Comparisons" | "Actions";
  label: string;
  hint?: string;
  icon: React.ReactNode;
  shortcut?: string;
  keywords?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts: () => void;
  onLogout: () => void;
};

const matches = (item: Item, tokens: string[]) => {
  const hay =
    `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
};

/** Bold the first matched token inside a label so the user sees why it matched. */
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  const lower = text.toLowerCase();
  const hit = tokens
    .map((t) => [lower.indexOf(t), t.length] as const)
    .filter(([i]) => i >= 0)
    .sort((a, b) => a[0] - b[0])[0];
  if (!hit) return <>{text}</>;
  const [i, len] = hit;
  return (
    <>
      {text.slice(0, i)}
      <span className="rounded-[2px] bg-highlight/20 text-foreground">
        {text.slice(i, i + len)}
      </span>
      {text.slice(i + len)}
    </>
  );
}

/** ⌘K: jump to any paper or comparison, or run a shell action. Plain substring filter, keyboard first. */
export function CommandPalette({
  open,
  onOpenChange,
  onShowShortcuts,
  onLogout,
}: Props) {
  const router = useRouter();
  const papers = usePaperStore((s) => s.papers);
  const comparisons = useComparisonStore((s) => s.comparisons);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      ...papers.map<Item>((p) => ({
        id: `cmd-paper-${p.id}`,
        group: "Papers",
        label: p.title,
        hint: p.status === "ready" ? undefined : STATUS_LABEL[p.status],
        icon: <StatusDot status={p.status} />,
        keywords: p.source,
        run: go(`/papers/${p.id}`),
      })),
      ...comparisons.map<Item>((c) => ({
        id: `cmd-cmp-${c.id}`,
        group: "Comparisons",
        label: comparisonLabel(c),
        hint:
          isProcessing(c.status) || c.status === "failed"
            ? COMPARISON_LABEL[c.status]
            : undefined,
        icon: <GitCompareArrows className="size-3.5" />,
        keywords: c.titles.join(" "),
        run: go(`/comparisons/${c.id}`),
      })),
      {
        id: "cmd-library",
        group: "Actions",
        label: "Go to library",
        icon: <Library className="size-3.5" />,
        keywords: "home dashboard papers",
        run: go("/dashboard"),
      },
      {
        id: "cmd-add",
        group: "Actions",
        label: "Add a paper",
        hint: "Paste a link or upload a PDF",
        icon: <Plus className="size-3.5" />,
        keywords: "new upload link arxiv doi pdf",
        run: () => {
          if (!focusAddPaper()) {
            router.push("/dashboard");
            focusAddPaperSoon();
          }
        },
      },
      {
        id: "cmd-shortcuts",
        group: "Actions",
        label: "Keyboard shortcuts",
        icon: <Keyboard className="size-3.5" />,
        shortcut: "?",
        keywords: "help keys",
        run: onShowShortcuts,
      },
      {
        id: "cmd-logout",
        group: "Actions",
        label: "Log out",
        icon: <LogOut className="size-3.5" />,
        keywords: "sign out account",
        run: onLogout,
      },
    ];
  }, [papers, comparisons, router, onShowShortcuts, onLogout]);

  const pick = (item: Item) => {
    onOpenChange(false);
    // let the dialog return focus first, then act (dialogs opened by an action keep their focus)
    setTimeout(item.run, 0);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          aria-label="Search"
          className="fixed top-[12vh] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-col overflow-hidden rounded-lg border bg-popover text-sm shadow-xl shadow-black/40 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-1 data-closed:animate-out data-closed:fade-out-0"
        >
          <PaletteBody items={items} pick={pick} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Query + highlighted row. Lives inside the popup so it resets every time the palette opens. */
function PaletteBody({
  items,
  pick,
}: {
  items: Item[];
  pick: (item: Item) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = tokens.length
    ? items.filter((i) => matches(i, tokens))
    : items;
  const current = visible[Math.min(active, visible.length - 1)];

  useEffect(() => {
    if (current)
      document.getElementById(current.id)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey))
      setActive((a) => Math.min(a + 1, visible.length - 1));
    else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey))
      setActive((a) => Math.max(a - 1, 0));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(visible.length - 1);
    else if (e.key === "Enter") {
      if (current) pick(current);
    } else return;
    e.preventDefault();
  };

  return (
    <>
      <div className="flex items-center gap-2.5 border-b px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls="palette-list"
          aria-activedescendant={current?.id}
          aria-autocomplete="list"
          aria-label="Search papers, comparisons and actions"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search papers, comparisons, actions…"
          className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <Kbd>Esc</Kbd>
      </div>

      <div
        id="palette-list"
        role="listbox"
        aria-label="Results"
        className="scroll-shadow-y max-h-[50vh] overflow-y-auto p-1.5"
        style={{ "--scroll-bg": "var(--popover)" } as React.CSSProperties}
      >
        {visible.length === 0 && (
          <p className="px-2.5 py-8 text-center text-muted-foreground">
            No matches for{" "}
            <span className="text-foreground">“{query.trim()}”</span>
          </p>
        )}
        {visible.map((item, idx) => {
          const header = idx === 0 || visible[idx - 1].group !== item.group;
          const selected = item === current;
          return (
            <div key={item.id}>
              {header && (
                <p
                  className={cn(
                    "px-2.5 pb-1 text-[11px] text-muted-foreground",
                    idx > 0 ? "pt-3" : "pt-1.5",
                  )}
                >
                  {item.group}
                </p>
              )}
              <div
                id={item.id}
                role="option"
                aria-selected={selected}
                onMouseMove={() => !selected && setActive(idx)}
                onClick={() => pick(item)}
                className={cn(
                  "flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2",
                  selected
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="grid size-4 shrink-0 place-items-center">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span
                    className={
                      selected ? "text-foreground" : "text-foreground/90"
                    }
                  >
                    <Highlight text={item.label} tokens={tokens} />
                  </span>
                  {item.hint && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                  )}
                </span>
                {item.shortcut ? (
                  <Kbd combo={item.shortcut} className="shrink-0" />
                ) : (
                  <CornerDownLeft
                    className={cn(
                      "size-3.5 shrink-0 text-muted-foreground",
                      !selected && "invisible",
                    )}
                    aria-hidden
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> to move
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↵</Kbd> to open
        </span>
        <span className="ml-auto tabular-nums" aria-live="polite">
          {tokens.length > 0 && `${visible.length} of ${items.length}`}
        </span>
      </div>
    </>
  );
}
