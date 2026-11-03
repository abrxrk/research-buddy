import { GITHUB_URL } from "@/components/landing/constants";
import { GithubIcon } from "@/components/layout/GithubIcon";
import { Logo } from "@/components/layout/Logo";

const LINKS = [
  ["How it works", "#how"],
  ["Features", "#features"],
  ["Across papers", "#across"],
  ["Under the hood", "#retrieval"],
];

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Your AI reading partner for research papers.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground md:ml-auto">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-foreground">{label}</a>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <GithubIcon className="size-3.5" /> GitHub
          </a>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-6 pb-10 text-xs text-muted-foreground">© 2026 Research Buddy · Built with open models and a lot of papers.</p>
    </footer>
  );
}
