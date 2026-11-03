import Link from "next/link";

import { cn } from "@/lib/utils";

/** Research Buddy mark: an open book with a highlighter stroke across it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-7 place-items-center rounded-md bg-foreground text-background", className)}>
      <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
        <rect x="5" y="13" width="14" height="4" rx="1" transform="rotate(-8 12 15)" fill="var(--color-highlight)" opacity="0.9" />
        <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 6.5v13" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} aria-label="Research Buddy home" className={cn("flex items-center gap-2 rounded-md", className)}>
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">Research Buddy</span>
    </Link>
  );
}
