"use client";

import { useEffect, useRef, useState } from "react";

import { Kbd } from "@/components/ui/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type SectionTab = { key: string; label: string; body: React.ReactNode; busy?: boolean; count?: number };

type Props = {
  tabs: SectionTab[];
  /** Controlled value; omit for uncontrolled (first tab). */
  value?: string;
  onValueChange?: (key: string) => void;
  /** Number keys 1-9 switch tabs (hint shown in the tab tooltip). */
  hotkeys?: boolean;
  /** Right-aligned content in the tab strip (e.g. a hint). */
  aside?: React.ReactNode;
};

/** Underlined tab strip used on the paper and comparison pages. `busy` marks a tab still being generated. */
export function SectionTabs({ tabs, value, onValueChange, hotkeys = false, aside }: Props) {
  const [inner, setInner] = useState(tabs[0]?.key);
  const active = value ?? inner;
  const select = (key: string) => {
    setInner(key);
    onValueChange?.(key);
  };

  // Digit keys 1-9 switch tabs, except while typing (chat box, filters).
  const latest = useRef({ tabs, select });
  useEffect(() => {
    latest.current = { tabs, select };
  });
  useEffect(() => {
    if (!hotkeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const i = Number(e.key) - 1;
      const { tabs, select } = latest.current;
      if (!Number.isInteger(i) || i < 0 || i >= Math.min(tabs.length, 9)) return;
      e.preventDefault();
      select(tabs[i].key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkeys]);

  return (
    <Tabs value={active} onValueChange={(v) => select(String(v))} className="gap-8">
      {/* Bleeds to the page edge and scrolls sideways on narrow screens. Border is an inset shadow so the overflow clip doesn't eat it.
          top-14 clears the mobile header (h-14, lg:hidden). */}
      <div className="no-scrollbar sticky top-14 z-10 -mx-6 flex lg:top-0 h-12 items-end gap-5 overflow-x-auto bg-background px-6 shadow-[inset_0_-1px_0_var(--border)] sm:-mx-1 sm:px-1">
        <TabsList variant="line" className="no-scrollbar h-auto! w-auto justify-start gap-5 rounded-none border-0 p-0">
          {tabs.map((t, i) => {
            const trigger = (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className={cn(
                  "h-auto flex-none gap-1.5 rounded-none px-0 pb-2.5 text-sm font-normal after:bottom-0! data-active:font-medium",
                  "focus-visible:ring-0 focus-visible:outline-offset-4",
                )}
              >
                {t.label}
                {t.count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{t.count}</span>}
                {t.busy && <span className="size-1.5 animate-pulse rounded-full bg-highlight" role="img" aria-label="still being written" />}
              </TabsTrigger>
            );
            return hotkeys && i < 9 ? (
              <Tip key={t.key} content={`Switch to ${t.label}`} shortcut={String(i + 1)} side="bottom">
                {trigger}
              </Tip>
            ) : (
              trigger
            );
          })}
        </TabsList>
        {(aside || hotkeys) && (
          <div className="mb-2.5 ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            {aside ?? (
              <>
                <Kbd>1</Kbd>–<Kbd>{Math.min(tabs.length, 9)}</Kbd> <span className="ml-0.5">switch tab</span>
              </>
            )}
          </div>
        )}
      </div>
      {tabs.map((t) => (
        <TabsContent key={t.key} value={t.key} className="focus-visible:outline-none">
          {t.body}
        </TabsContent>
      ))}
    </Tabs>
  );
}

