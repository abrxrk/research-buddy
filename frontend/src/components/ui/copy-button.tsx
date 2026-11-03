"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  /** Text to copy, or a function that produces it on click. */
  text: string | (() => string);
  /** Tooltip + aria-label. Default "Copy". */
  label?: string;
  size?: "icon-xs" | "icon-sm" | "icon";
  className?: string;
  /** Show the label next to the icon instead of icon-only. */
  withText?: boolean;
};

/** Icon button that copies text; shows a check for 1.5 s. */
export function CopyButton({ text, label = "Copy", size = "icon-xs", className, withText }: Props) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(typeof text === "function" ? text() : text);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const Icon = copied ? Check : Copy;
  return (
    <Tip content={copied ? "Copied" : label}>
      <Button
        type="button"
        variant="ghost"
        size={withText ? (size === "icon" ? "default" : size === "icon-sm" ? "sm" : "xs") : size}
        onClick={copy}
        aria-label={copied ? "Copied" : label}
        className={cn("text-muted-foreground hover:text-foreground", copied && "text-emerald-400 hover:text-emerald-400", className)}
      >
        <Icon aria-hidden />
        {withText && (copied ? "Copied" : label)}
      </Button>
    </Tip>
  );
}
