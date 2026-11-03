"use client";

import { Menu } from "@base-ui/react/menu";
import { ArrowUpRight, Check, Equal, GitCompareArrows, Link2, Loader2, MoreHorizontal, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { comparisonsApi } from "@/api/comparisons";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { AppShell, PageWithChat } from "@/components/layout/AppShell";
import { SectionTabs } from "@/components/layout/SectionTabs";
import { Section } from "@/components/paper/Section";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeAgo } from "@/components/ui/time-ago";
import { Tip } from "@/components/ui/tooltip";
import { COMPARISON_LABEL, isProcessing, parseDate, plural, truncate } from "@/helpers/format";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePolling } from "@/hooks/usePolling";
import { cn } from "@/lib/utils";
import { useComparisonStore } from "@/store/comparisonStore";
import type { Comparison, ComparisonAspect, ComparisonResult, ComparisonStatus } from "@/types";

const CHAT_SUGGESTIONS = ["Which paper reports the strongest results?", "How do their methods differ?", "Which datasets do they have in common?"];
const STAGES: ComparisonStatus[] = ["queued", "briefing", "synthesizing"];

/* ---------- paper identity: P1, P2… used everywhere ---------- */

/** Stable index badge for a paper (1-based, matches `titles` and `per_paper.paper`). */
function PaperBadge({ n, className, ...rest }: { n: number; className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...rest} className={cn("inline-flex h-5 shrink-0 items-center rounded-sm border bg-elevated px-1.5 font-mono text-[11px] leading-none text-muted-foreground tabular-nums", className)}>
      P{n}
    </span>
  );
}

/** Badge + title, linking to the paper. */
function PaperName({ doc, i, className, clamp }: { doc: Comparison; i: number; className?: string; clamp?: boolean }) {
  const title = <span className={cn("min-w-0 decoration-muted-foreground/50 underline-offset-3 group-hover/paper:underline", clamp ? "line-clamp-3 [overflow-wrap:anywhere] md:line-clamp-2" : "truncate")}>{doc.titles[i]}</span>;
  return (
    <Link href={`/papers/${doc.paper_ids[i]}`} className={cn("group/paper flex min-w-0 items-center gap-2 rounded-sm", clamp && "items-start", className)}>
      <PaperBadge n={i + 1} className={cn(clamp && "mt-px")} />
      {clamp ? title : <Tip content={doc.titles[i]} whenTruncated>{title}</Tip>}
      <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/paper:opacity-100 group-focus-visible/paper:opacity-100" />
    </Link>
  );
}

// ponytail: the model writes "Paper 1 (arXiv:1706.03762)" / "Paper 2 (<full title>)"; swap for a badge and drop
// the parenthesised title. A paren that isn't the title (rare) is kept.
const REF = /Paper (\d+)(?: \(([^)]{1,120})\))?/g;
const isTitleParen = (paren: string | undefined, title: string) =>
  !!paren && (/arxiv/i.test(paren) || title.toLowerCase().includes(paren.toLowerCase().slice(0, 20)));

/** Text with "Paper N" mentions rendered as badges (hover shows the title). */
function Refs({ text, titles }: { text: string; titles: string[] }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(REF)) {
    const n = Number(m[1]);
    if (!titles[n - 1]) continue;
    out.push(text.slice(last, m.index));
    const keepParen = m[2] && !isTitleParen(m[2], titles[n - 1]);
    const possessive = /^['’]/.test(text[m.index + m[0].length] ?? "");
    out.push(
      <Fragment key={m.index}>
        <Tip content={titles[n - 1]}>
          <PaperBadge n={n} aria-label={`Paper ${n}: ${titles[n - 1]}`} className={cn("ml-0.5 -translate-y-px text-foreground", !possessive && "mr-0.5")} />
        </Tip>
        {keepParen ? ` (${m[2]})` : ""}
      </Fragment>,
    );
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

/** The one-liners start with "Paper 1 (title):" which the row already shows. */
const stripLead = (s: string) => s.replace(/^Paper \d+(?: \([^)]*\))?:\s*/, "");

/* ---------- export ---------- */

/** Plain-text twin of <Refs>: "Paper 1 (title)" → "P1". */
const plain = (s: string, titles: string[]) =>
  s.replace(REF, (m, n, p) => (!titles[+n - 1] ? m : !p || isTitleParen(p, titles[+n - 1]) ? `P${n}` : `P${n} (${p})`));

function toMarkdown(doc: Comparison, r: ComparisonResult): string {
  const t = doc.titles;
  const name = (i: number) => `**P${i + 1}** ${t[i]}`;
  const list = (heading: string, items: string[]) => (items.length ? ["", `### ${heading}`, "", ...items.map((s) => `- ${plain(s, t)}`)] : []);
  const lines = [`# Comparison of ${t.length} papers`, "", ...t.map((_, i) => `- ${name(i)}`), "", "## Overview", "", plain(r.overview.summary, t), ""];
  for (const p of r.overview.papers) lines.push(`- ${name(p.paper - 1)} — ${plain(stripLead(p.one_liner), t)}`);
  for (const a of r.aspects) {
    lines.push("", `## ${a.name}`, "", plain(a.summary, t), ...list("In common", a.similarities), ...list("Differences", a.differences));
    lines.push("", "### Side by side", "", `| Paper | ${a.name} |`, "| --- | --- |");
    for (const p of a.per_paper) lines.push(`| ${name(p.paper - 1)} | ${plain(p.value, t).replace(/\|/g, "\\|")} |`);
  }
  return lines.join("\n");
}

/* ---------- tabs ---------- */

function Count({ n }: { n: number }) {
  return <span className="text-xs text-muted-foreground tabular-nums">{n}</span>;
}

function Points({ items, titles, empty }: { items: string[]; titles: string[]; empty: string }) {
  if (!items.length) return <p className="text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden className="mt-[0.6em] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
          <span className="min-w-0"><Refs text={s} titles={titles} /></span>
        </li>
      ))}
    </ul>
  );
}

/** Side-by-side table: one row per paper, aligned columns, subtle zebra. */
function PerPaper({ doc, label, rows, empty }: { doc: Comparison; label: string; rows: { paper: number; text: string }[]; empty: string }) {
  return (
    <table className="w-full table-fixed border-y text-sm">
      <colgroup><col className="w-2/5 md:w-72" /><col /></colgroup>
      <thead className="sr-only">
        <tr><th scope="col">Paper</th><th scope="col">{label}</th></tr>
      </thead>
      <tbody className="divide-y">
        {doc.titles.map((_, i) => {
          const v = rows.find((p) => p.paper === i + 1)?.text;
          return (
            <tr key={i} className="align-top even:bg-muted/20">
              <th scope="row" className="py-3 pr-4 pl-2 text-left font-medium md:pr-6">
                <PaperName doc={doc} i={i} clamp />
              </th>
              <td className={cn("py-3 pr-2", v ? "" : "text-muted-foreground")}>
                {v ? <Refs text={v} titles={doc.titles} /> : empty}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function OverviewTab({ result, doc, onOpen }: { result: ComparisonResult; doc: Comparison; onOpen: (aspect: string) => void }) {
  const sim = result.aspects.reduce((n, a) => n + a.similarities.length, 0);
  const diff = result.aspects.reduce((n, a) => n + a.differences.length, 0);
  return (
    <div className="space-y-10">
      <Section title="Summary">
        <p className="max-w-prose text-base leading-relaxed"><Refs text={result.overview.summary} titles={doc.titles} /></p>
      </Section>
      <Section title="Each paper in one line">
        <PerPaper doc={doc} label="One line" rows={result.overview.papers.map((p) => ({ paper: p.paper, text: stripLead(p.one_liner) }))} empty="No one-line summary for this paper." />
      </Section>
      <Section
        title="At a glance"
        description={`${plural(sim, "similarity", "similarities")} and ${plural(diff, "difference")} across ${plural(result.aspects.length, "aspect")}. Pick an aspect to read them.`}
      >
        <table className="w-full table-fixed border-y text-sm">
          <colgroup><col /><col className="w-28" /><col className="w-28" /></colgroup>
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="py-2 pl-2 text-left font-normal">Aspect</th>
              <th scope="col" className="py-2 text-right font-normal"><span className="inline-flex items-center gap-1"><Equal className="size-3" aria-hidden />In common</span></th>
              <th scope="col" className="py-2 pr-2 text-right font-normal"><span className="inline-flex items-center gap-1"><GitCompareArrows className="size-3" aria-hidden />Differ</span></th>
            </tr>
          </thead>
          <tbody className="divide-y border-t">
            {result.aspects.map((a) => (
              <tr key={a.name} className="even:bg-muted/20">
                <td className="py-1 pl-0.5 font-medium">
                  <button type="button" onClick={() => onOpen(a.name)} className="rounded-sm px-1.5 py-1 text-left underline-offset-3 hover:underline focus-visible:ring-2 focus-visible:ring-highlight focus-visible:outline-none">
                    {a.name}
                  </button>
                </td>
                <td className="py-2 text-right tabular-nums">{a.similarities.length}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{a.differences.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function AspectTab({ aspect, doc }: { aspect: ComparisonAspect; doc: Comparison }) {
  return (
    <div className="space-y-10">
      <Section title="Summary">
        <p className="max-w-prose text-base leading-relaxed"><Refs text={aspect.summary} titles={doc.titles} /></p>
      </Section>
      <div className="grid gap-10 md:grid-cols-2">
        <Section
          title="In common"
          aside={<span className="flex items-center gap-1.5 text-muted-foreground"><Equal className="size-3.5" aria-hidden /><Count n={aspect.similarities.length} /></span>}
        >
          <Points items={aspect.similarities} titles={doc.titles} empty="Nothing in common was noted." />
        </Section>
        <Section
          title="Differences"
          aside={<span className="flex items-center gap-1.5 text-muted-foreground"><GitCompareArrows className="size-3.5" aria-hidden /><Count n={aspect.differences.length} /></span>}
        >
          <Points items={aspect.differences} titles={doc.titles} empty="No differences were noted." />
        </Section>
      </div>
      <Section title="Side by side" description={`Where each paper stands on ${aspect.name.toLowerCase()}.`}>
        <PerPaper doc={doc} label={aspect.name} rows={aspect.per_paper.map((p) => ({ paper: p.paper, text: p.value }))} empty="Not covered in this paper." />
      </Section>
    </div>
  );
}

/* ---------- states ---------- */

/** "42s" / "3m 07s" since `since`, ticking every second. */
function useElapsed(since: string) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const start = parseDate(since).getTime();
    const update = () => setS(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [since]);
  if (s > 3600) return null; // stale created_at (e.g. a day-old comparison being retried): no timer beats a silly one
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function Progress({ doc, since }: { doc: Comparison; since: string }) {
  const at = STAGES.indexOf(doc.status);
  const elapsed = useElapsed(since);
  return (
    <div className="rounded-lg border p-4 text-sm">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-medium">Writing the comparison</p>
        {elapsed && <p className="font-mono text-xs text-muted-foreground tabular-nums" aria-hidden>{elapsed}</p>}
      </div>
      <p className="mt-0.5 max-w-prose text-muted-foreground">
        Each paper is read on its own first, then the results are combined. With the free AI models this takes a few minutes. The page updates on its own.
      </p>
      <ol className="mt-4 space-y-2" role="status" aria-live="polite">
        {STAGES.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-2.5", i > at && "text-muted-foreground")}>
            <span className="grid size-4 place-items-center" aria-hidden>
              {i < at ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : i === at ? (
                <Loader2 className="size-3.5 animate-spin text-highlight" />
              ) : (
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              )}
            </span>
            <span className={cn(i === at && "font-medium")}>
              <span className="sr-only">{i < at ? "Done: " : i === at ? "In progress: " : "Pending: "}</span>
              {COMPARISON_LABEL[s]}
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{i + 1}/{STAGES.length}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Failed({ error, onRetry, retrying }: { error: string | null; onRetry: () => void; retrying: boolean }) {
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-red-400/30 bg-red-400/5 p-4 text-sm" role="alert">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">The comparison couldn&apos;t be written</p>
        <p className="mt-0.5 text-muted-foreground">{error || "Something went wrong on the way. Retrying usually fixes it."}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
        {retrying ? <Loader2 className="animate-spin" /> : <RotateCcw />} Try again
      </Button>
    </div>
  );
}

function Loading() {
  return (
    <PageWithChat chat={<Skeleton className="h-full rounded-lg" />}>
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-7 w-56" />
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-5 w-2/5" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-5 border-b pb-3">{[16, 24, 28, 16, 20].map((w, i) => <Skeleton key={i} className="h-4" style={{ width: `${w * 4}px` }} />)}</div>
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </div>
    </PageWithChat>
  );
}

/* ---------- page ---------- */

export function ComparisonWorkspace() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { user } = useAuth({ required: true });
  const [doc, setDoc] = useState<Comparison | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retriedAt, setRetriedAt] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ?tab= keeps the open aspect in the URL so links and refreshes land on the same section.
  const [tab, setTab] = useState(params.get("tab") ?? "overview");
  const selectTab = (key: string) => {
    setTab(key);
    const url = new URL(window.location.href);
    if (key === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", key);
    window.history.replaceState(window.history.state, "", url);
  };
  const removeComparison = useComparisonStore((s) => s.remove);
  const router = useRouter();

  const load = useCallback(() => comparisonsApi.get(id).then(setDoc), [id]);
  useEffect(() => {
    if (user) load().catch((e) => toast.error(e.message));
  }, [user, load]);
  usePolling(() => load().catch(() => {}), !!doc && isProcessing(doc.status));
  useDocumentTitle(doc ? truncate(doc.titles.join(" vs "), 70) : "Comparison");

  if (!user) return null;
  const result = doc?.status === "ready" ? doc.result : null;

  async function retry() {
    setRetrying(true);
    try {
      setDoc(await comparisonsApi.retry(id));
      setRetriedAt(new Date().toISOString());
      toast("Trying again", { description: "The comparison is being rewritten." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await removeComparison(id);
      toast.success("Comparison deleted");
      router.push("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      {!doc ? (
        <Loading />
      ) : (
        <PageWithChat
          chat={
            <ChatPanel
              chatPath={`/comparisons/${doc.id}/chat`}
              enabled
              title="Ask about these papers"
              description="Searches only the papers in this comparison and names the paper behind each point."
              subject="these papers"
              suggestions={CHAT_SUGGESTIONS}
            />
          }
        >
          <div className="space-y-8">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Comparing {doc.titles.length} papers</h1>
                <div className="flex shrink-0 items-center gap-1">
                  {result && (
                    <CopyButton text={() => toMarkdown(doc, result)} label="Copy as Markdown" size="icon-sm" withText className="text-muted-foreground" />
                  )}
                  <Menu.Root>
                    <Tip content="More actions">
                      <Menu.Trigger render={<Button variant="ghost" size="icon-sm" aria-label="More actions" className="text-muted-foreground" />}>
                        <MoreHorizontal />
                      </Menu.Trigger>
                    </Tip>
                    <Menu.Portal>
                      <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50 outline-none">
                        <Menu.Popup className="popup-anim min-w-44 rounded-md border bg-elevated p-1 text-sm shadow-md shadow-black/30">
                          <Menu.Item
                            className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 outline-none data-highlighted:bg-muted"
                            onClick={() => navigator.clipboard.writeText(location.href).then(() => toast.success("Link copied"), () => toast.error("Couldn't copy the link"))}
                          >
                            <Link2 className="size-3.5 text-muted-foreground" aria-hidden /> Copy link
                          </Menu.Item>
                          <Menu.Separator className="my-1 h-px bg-border" />
                          <Menu.Item
                            disabled={isProcessing(doc.status)}
                            className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-red-300 outline-none data-highlighted:bg-red-400/10 data-disabled:opacity-50"
                            onClick={() => setConfirmDelete(true)}
                          >
                            <Trash2 className="size-3.5" aria-hidden /> Delete comparison…
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                </div>
              </div>

              <ol className="space-y-1.5 text-sm" aria-label="Papers in this comparison">
                {doc.titles.map((_, i) => (
                  <li key={i} className="flex min-w-0"><PaperName doc={doc} i={i} className="max-w-full py-0.5 pr-1" /></li>
                ))}
              </ol>

              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <TimeAgo iso={doc.created_at} prefix="Created" />
                {result && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{plural(result.aspects.length, "aspect")} compared</span>
                  </>
                )}
              </p>
            </header>

            {isProcessing(doc.status) && <Progress doc={doc} since={retriedAt ?? doc.created_at} />}
            {doc.status === "failed" && <Failed error={doc.error} onRetry={retry} retrying={retrying} />}

            {result && (
              <SectionTabs
                value={result.aspects.some((a) => a.name === tab) ? tab : "overview"}
                onValueChange={selectTab}
                hotkeys
                tabs={[
                  { key: "overview", label: "Overview", body: <OverviewTab result={result} doc={doc} onOpen={selectTab} /> },
                  ...result.aspects.map((a) => ({ key: a.name, label: a.name, body: <AspectTab aspect={a} doc={doc} /> })),
                ]}
              />
            )}
          </div>

          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Delete this comparison?</DialogTitle>
                <DialogDescription>The comparison and its chat history will be deleted. The papers themselves stay in your library.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
                <Button variant="destructive" size="sm" onClick={remove} disabled={deleting}>
                  {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </PageWithChat>
      )}
    </AppShell>
  );
}
