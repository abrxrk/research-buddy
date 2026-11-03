"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { useState } from "react";

import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

/** Mount once near the root (done in app/layout.tsx): shared short delay, adjacent tooltips open instantly. */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delay={350} closeDelay={0}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

type TipProps = {
  /** Text (or small node) shown in the tooltip. Nothing renders when empty. */
  content: React.ReactNode;
  /** Optional shortcut hint rendered as <Kbd combo>, e.g. "mod+k". */
  shortcut?: string;
  /** The single element that triggers the tooltip. Must accept a ref and spread props (any DOM element or Button). */
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Only show when the child's text is actually truncated (overflowing). For `truncate` labels. */
  whenTruncated?: boolean;
  className?: string;
};

/**
 * Small dark tooltip. Usage:
 *   <Tip content="Delete paper"><Button size="icon-sm" aria-label="Delete paper" ... /></Tip>
 *   <Tip content={title} whenTruncated><span className="truncate">{title}</span></Tip>
 *   <Tip content="Search" shortcut="mod+k">...</Tip>
 */
export function Tip({ content, shortcut, children, side = "top", align = "center", whenTruncated, className }: TipProps) {
  const [truncated, setTruncated] = useState(!whenTruncated);
  if (!content && !shortcut) return children;
  return (
    <TooltipPrimitive.Root disabled={!truncated}>
      <TooltipPrimitive.Trigger
        render={children}
        onPointerEnter={
          whenTruncated
            ? (e: React.PointerEvent<HTMLElement>) => setTruncated(e.currentTarget.scrollWidth > e.currentTarget.clientWidth)
            : undefined
        }
      />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} align={align} sideOffset={6} collisionPadding={8} className="z-50 outline-none">
          <TooltipPrimitive.Popup
            className={cn(
              "popup-anim flex max-w-xs items-center gap-2 rounded-md border bg-elevated px-2 py-1 text-xs text-foreground shadow-md shadow-black/30",
              className,
            )}
          >
            {content && <span className="min-w-0 text-pretty">{content}</span>}
            {shortcut && <Kbd combo={shortcut} className="-mr-0.5" />}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/** Raw Base UI parts for custom tooltips (rich content, controlled open). */
export const Tooltip = TooltipPrimitive;
