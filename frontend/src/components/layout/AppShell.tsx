"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight, GitCompareArrows, Library, MessageSquare, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { Logo } from "@/components/layout/Logo";
import { ShortcutsDialog } from "@/components/layout/ShortcutsDialog";
import { UserMenu } from "@/components/layout/UserMenu";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { Tip } from "@/components/ui/tooltip";
import { COMPARISON_LABEL, isProcessing, STATUS_LABEL, STEPS, truncate } from "@/helpers/format";
import { useAuth } from "@/hooks/useAuth";
import { useHotkey } from "@/hooks/useHotkey";
import { usePolling } from "@/hooks/usePolling";
import { cn } from "@/lib/utils";
import { useComparisonStore } from "@/store/comparisonStore";
import { usePaperStore } from "@/store/paperStore";
import type { Comparison, Paper } from "@/types";

import { comparisonLines, focusAddPaper, focusAddPaperSoon, lastStatus, sectionOpen } from "./shell";
import { StatusDot } from "./StatusDot";

/** Sidebar row. Active rows get a thin yellow bar on the sidebar's edge. */
function NavItem({ href, active, children, className }: { href: string; active: boolean; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150",
        active
          ? "bg-muted text-foreground before:absolute before:inset-y-2 before:-left-2 before:w-0.5 before:rounded-full before:bg-highlight"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Title that only shows a tooltip when it is actually cut off, plus an optional second line. */
function TwoLine({ title, sub, subClass }: { title: string; sub?: string; subClass?: string }) {
  return (
    <span className="min-w-0 flex-1">
      <Tip content={title} side="right" whenTruncated>
        <span className="block truncate">{title}</span>
      </Tip>
      {sub && <span className={cn("block truncate text-[11px] leading-4 text-muted-foreground", subClass)}>{sub}</span>}
    </span>
  );
}

const paperSub = (p: Paper) => {
  if (p.status === "failed") return "Failed";
  if (!isProcessing(p.status)) return undefined;
  const step = STEPS.indexOf(p.status);
  return step < 0 ? STATUS_LABEL[p.status] : `${STATUS_LABEL[p.status]} · ${step + 1}/${STEPS.length}`;
};

const comparisonSub = (c: Comparison) => (c.status === "ready" ? comparisonLines(c).sub : COMPARISON_LABEL[c.status]);

/** Collapsible sidebar group. Open state lives in shell.ts so it survives the per-page remount. */
function Section({ title, count, action, children }: { title: string; count?: number; action?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(sectionOpen[title] ?? true);
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(v) => {
        sectionOpen[title] = v;
        setOpen(v);
      }}
    >
      <div className="group/head flex items-center pr-1">
        <Collapsible.Trigger className="group/trigger flex h-7 min-w-0 flex-1 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronRight className="size-3 transition-transform duration-150 group-data-[panel-open]/trigger:rotate-90" aria-hidden />
          <span>{title}</span>
          {count !== undefined && <span className="ml-1 font-mono text-[11px] tabular-nums text-muted-foreground/70">{count}</span>}
        </Collapsible.Trigger>
        {action}
      </div>
      <Collapsible.Panel className="pt-0.5">{children}</Collapsible.Panel>
    </Collapsible.Root>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-1 px-2 py-1" aria-busy aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-7 items-center gap-2">
          <Skeleton className="size-1.5 rounded-full" />
          <Skeleton className="h-3.5" style={{ width: `${78 - i * 14}%` }} />
        </div>
      ))}
    </div>
  );
}

const iconBtn =
  "grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/head:opacity-100 data-popup-open:opacity-100";

type ShellActions = { onSearch: () => void; onShortcuts: () => void; onAddPaper: () => void };

/** Left navigation: library, every paper and comparison (with live status), and the account menu. */
function Sidebar({ onSearch, onShortcuts, onAddPaper }: ShellActions) {
  const path = usePathname();
  const { user, logout } = useAuth();
  const { papers, loading } = usePaperStore();
  const { comparisons, loaded } = useComparisonStore();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Logo href="/dashboard" />
      </div>

      <div className="px-2 pb-3">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-8 w-full items-center gap-2 rounded-md border bg-background/50 px-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="flex-1 text-left">Search…</span>
          <Kbd combo="mod+k" />
        </button>
      </div>

      <nav className="scroll-shadow-y min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pb-4" aria-label="Main">
        <NavItem href="/dashboard" active={path === "/dashboard"}>
          <Library className="size-4" aria-hidden /> Library
        </NavItem>

        <Section
          title="Papers"
          count={loading ? undefined : papers.length}
          action={
            <Tip content="Add a paper" side="right">
              <button type="button" onClick={onAddPaper} aria-label="Add a paper" className={iconBtn}>
                <Plus className="size-3.5" />
              </button>
            </Tip>
          }
        >
          {loading ? (
            <ListSkeleton rows={3} />
          ) : papers.length ? (
            <ul>
              {papers.map((p) => (
                <li key={p.id}>
                  <NavItem href={`/papers/${p.id}`} active={path === `/papers/${p.id}`} className={paperSub(p) ? "py-1" : undefined}>
                    <StatusDot status={p.status} />
                    <TwoLine title={p.title} sub={paperSub(p)} subClass={p.status === "failed" ? "text-red-300/80" : undefined} />
                  </NavItem>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1 text-xs text-muted-foreground/70">
              No papers yet.{" "}
              <button type="button" onClick={onAddPaper} className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Add one
              </button>
            </p>
          )}
        </Section>

        <Section title="Comparisons" count={loaded ? comparisons.length : undefined}>
          {!loaded ? (
            <ListSkeleton rows={1} />
          ) : comparisons.length ? (
            <ul>
              {comparisons.map((c) => (
                <li key={c.id}>
                  <NavItem href={`/comparisons/${c.id}`} active={path === `/comparisons/${c.id}`} className="py-1">
                    {isProcessing(c.status) || c.status === "failed" ? <StatusDot status={c.status} /> : <GitCompareArrows className="size-3.5 shrink-0" aria-hidden />}
                    <TwoLine title={comparisonLines(c).title} sub={comparisonSub(c)} subClass={c.status === "failed" ? "text-red-300/80" : undefined} />
                  </NavItem>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1 text-xs text-pretty text-muted-foreground/70">Tick 2 to 5 ready papers in the library to compare them.</p>
          )}
        </Section>
      </nav>

      {user && (
        <div className="border-t p-2">
          <UserMenu user={user} onSearch={onSearch} onShortcuts={onShortcuts} onLogout={logout} />
        </div>
      )}
    </aside>
  );
}

/** Small screens: a top bar; papers and comparisons are reached through search. */
function MobileBar({ onSearch, onShortcuts }: ShellActions) {
  const path = usePathname();
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-0.5 border-b bg-background px-3 lg:hidden">
      <Logo href="/dashboard" className="mr-auto" />
      <Tip content="Search" shortcut="mod+k">
        <button type="button" onClick={onSearch} aria-label="Search" className="grid size-10 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <Search className="size-4" />
        </button>
      </Tip>
      <Tip content="Library">
        <Link href="/dashboard" aria-label="Library" aria-current={path === "/dashboard" ? "page" : undefined} className="grid size-10 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-[current]:text-foreground">
          <Library className="size-4" />
        </Link>
      </Tip>
      {user && <UserMenu compact user={user} onSearch={onSearch} onShortcuts={onShortcuts} onLogout={logout} />}
    </header>
  );
}

/** Watches paper statuses and toasts when one finishes, with a link to it unless it's already open. */
function useFinishedToasts(papers: Paper[], path: string, router: ReturnType<typeof useRouter>) {
  useEffect(() => {
    for (const p of papers) {
      const was = lastStatus.get(p.id);
      if (was && isProcessing(was) && !isProcessing(p.status) && path !== `/papers/${p.id}`) {
        const action = { label: "Open", onClick: () => router.push(`/papers/${p.id}`) };
        if (p.status === "ready") toast.success(`“${truncate(p.title, 48)}” is ready`, { action });
        else toast.error(`“${truncate(p.title, 48)}” failed to process`, { action });
      }
    }
    lastStatus.clear();
    for (const p of papers) lastStatus.set(p.id, p.status);
  }, [papers, path, router]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { papers, fetchPapers } = usePaperStore();
  const { comparisons, fetchComparisons } = useComparisonStore();
  const [palette, setPalette] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);

  const refresh = useCallback(() => {
    fetchPapers().catch(() => {});
    fetchComparisons().catch(() => {});
  }, [fetchPapers, fetchComparisons]);
  useEffect(refresh, [refresh]);
  usePolling(refresh, papers.some((p) => isProcessing(p.status)) || comparisons.some((c) => isProcessing(c.status)));
  useFinishedToasts(papers, path, router);

  const addPaper = useCallback(() => {
    if (!focusAddPaper()) {
      router.push("/dashboard");
      focusAddPaperSoon();
    }
  }, [router]);
  const stepPaper = (dir: 1 | -1) => {
    if (!papers.length) return;
    const i = papers.findIndex((p) => path === `/papers/${p.id}`);
    const next = i < 0 ? (dir === 1 ? 0 : papers.length - 1) : (i + dir + papers.length) % papers.length;
    router.push(`/papers/${papers[next].id}`);
  };

  useHotkey("mod+k", () => setPalette((o) => !o), { allowInInput: true });
  useHotkey("shift+?", () => setShortcuts(true));
  useHotkey("alt+arrowdown", () => stepPaper(1));
  useHotkey("alt+arrowup", () => stepPaper(-1));

  const actions: ShellActions = { onSearch: () => setPalette(true), onShortcuts: () => setShortcuts(true), onAddPaper: addPaper };

  return (
    <div className="flex min-h-screen">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-highlight px-3 py-2 text-sm font-medium text-highlight-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar {...actions} />
      <div className="min-w-0 flex-1">
        <MobileBar {...actions} />
        {children}
      </div>
      <CommandPalette open={palette} onOpenChange={setPalette} onShowShortcuts={() => setShortcuts(true)} onLogout={logout} />
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
    </div>
  );
}

/** Two-column page body: main content, and the chat panel pinned on the right. Below xl the chat
 *  stacks under the page, so a bottom bar jumps to it and hides once the chat is on screen. */
export function PageWithChat({ children, chat }: { children: React.ReactNode; chat: React.ReactNode }) {
  const aside = useRef<HTMLElement>(null);
  const [chatVisible, setChatVisible] = useState(false);
  useEffect(() => {
    if (!aside.current) return;
    const io = new IntersectionObserver(([e]) => setChatVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(aside.current);
    return () => io.disconnect();
  }, []);

  return (
    // xl+: the chat is a full-height right column, flush with the window like the sidebar on the left.
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_400px]">
      <main id="main" tabIndex={-1} className="min-w-0 px-6 py-8 outline-none lg:px-10">{children}</main>
      <aside ref={aside} id="chat" className="scroll-mt-16 px-6 pb-20 lg:px-10 xl:sticky xl:top-0 xl:h-screen xl:border-l xl:p-0">
        <div className="h-[560px] xl:h-full">{chat}</div>
      </aside>
      <a
        href="#chat"
        aria-hidden={chatVisible}
        tabIndex={chatVisible ? -1 : 0}
        className={cn(
          "fixed inset-x-3 bottom-3 z-20 flex h-10 items-center justify-center gap-2 rounded-md border bg-popover text-sm shadow-lg shadow-black/40 transition-opacity duration-150 xl:hidden",
          chatVisible && "pointer-events-none opacity-0",
        )}
      >
        <MessageSquare className="size-4" aria-hidden /> Ask a question
      </a>
    </div>
  );
}
