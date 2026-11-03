"use client";

import { formatCombo, useIsMac } from "@/hooks/useHotkey";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"kbd"> & {
  /** A hotkey combo like "mod+k" or "shift+/"; rendered as "⌘K" on Mac, "Ctrl K" elsewhere. */
  combo?: string;
};

/** Keyboard hint: mono, small, subtle border. <Kbd>Esc</Kbd> or <Kbd combo="mod+k" />. */
export function Kbd({ combo, className, children, ...props }: Props) {
  const mac = useIsMac();
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-sm border border-border bg-elevated px-1 font-mono text-[10.5px] leading-none text-muted-foreground",
        className,
      )}
      {...props}
    >
      {combo ? formatCombo(combo, mac) : children}
    </kbd>
  );
}
