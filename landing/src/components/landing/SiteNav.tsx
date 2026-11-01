"use client";

import { useEffect, useState } from "react";

import { GITHUB_URL } from "@/components/landing/constants";
import { PrimaryCta } from "@/components/landing/PrimaryCta";
import { GithubIcon } from "@/components/layout/GithubIcon";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  ["How it works", "#how"],
  ["Features", "#features"],
  ["Under the hood", "#retrieval"],
];

/** Floating pill nav that tightens up once you scroll. */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4">
      <header
        className={cn(
          "pointer-events-auto flex w-full items-center gap-6 rounded-full border px-3 py-2 pl-4 transition-all duration-500",
          scrolled ? "max-w-3xl border-white/10 bg-zinc-950/70 shadow-2xl backdrop-blur-xl" : "max-w-6xl border-transparent bg-transparent",
        )}
      >
        <Logo />
        <nav className="mx-auto hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="rounded-full px-3 py-1.5 transition-colors hover:bg-white/5 hover:text-foreground">{label}</a>
          ))}
        </nav>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub" className="ml-auto grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:ml-0">
          <GithubIcon />
        </a>
        <PrimaryCta className="px-4 py-2 text-sm" />
      </header>
    </div>
  );
}
