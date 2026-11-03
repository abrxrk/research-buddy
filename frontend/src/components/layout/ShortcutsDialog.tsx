"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

import { SHORTCUTS, type ShortcutGroup } from "./shell";

const GROUPS: ShortcutGroup[] = ["Everywhere", "Library", "Paper and comparison", "Chat"];

/** The keyboard shortcut list, opened with "?" or from the account menu. */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Letter shortcuts are off while you type; chat shortcuts work in the chat box.</DialogDescription>
        </DialogHeader>
        <div className="scroll-shadow-y -mx-1 max-h-[60vh] overflow-y-auto px-1">
          {GROUPS.map((group, gi) => (
            <section key={group} aria-label={group}>
              <h3 className={gi > 0 ? "pt-4 pb-1 text-xs text-muted-foreground" : "pb-1 text-xs text-muted-foreground"}>{group}</h3>
              <ul className="divide-y">
                {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-4 py-1.5 text-sm">
                    <span>{s.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          {i > 0 && <span className="text-xs text-muted-foreground">/</span>}
                          <Kbd combo={k} />
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
