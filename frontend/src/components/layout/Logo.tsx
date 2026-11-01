import Link from "next/link";

import { cn } from "@/lib/utils";

/** Research Buddy mark: an open book with a highlighter stroke across it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-8 place-items-center rounded-lg bg-foreground text-background", className)}>
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
        <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 6.5v13" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      <span className="absolute -right-1 -bottom-1 h-2 w-4 -rotate-12 rounded-sm bg-highlight" />
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">
        Research <span className="font-serif text-lg font-normal italic">Buddy</span>
      </span>
    </Link>
  );
}
