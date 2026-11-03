"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { AddPaperBar } from "@/components/dashboard/AddPaperBar";
import { DropOverlay } from "@/components/dashboard/DropOverlay";
import { PaperGrid } from "@/components/dashboard/PaperGrid";
import { AppShell, PageWithChat } from "@/components/layout/AppShell";
import { canChat, isProcessing, plural } from "@/helpers/format";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePaperStore } from "@/store/paperStore";

export default function DashboardPage() {
  const { user } = useAuth({ required: true });
  const papers = usePaperStore((s) => s.papers);
  const processing = papers.filter((p) => isProcessing(p.status)).length;
  useDocumentTitle(processing ? `(${processing}) Library` : "Library");
  if (!user) return null;

  const ready = papers.filter((p) => p.status === "ready").length;
  const failed = papers.filter((p) => p.status === "failed").length;
  const searchable = papers.filter((p) => canChat(p.status)).length;

  return (
    <AppShell>
      <PageWithChat
        chat={
          <ChatPanel
            chatPath="/library/chat"
            enabled={searchable > 0}
            title="Ask your library"
            description={searchable ? `Searches all ${searchable} indexed papers and cites each source.` : "Searches every paper you add and cites each source."}
            subject="your papers"
            disabledHint="Add a paper to start. Once it's indexed you can ask questions across your whole library here."
            suggestions={["Which papers discuss evaluation metrics?", "What methods do my papers share?", "Summarise each paper in one line"]}
          />
        }
      >
        <div className="space-y-8">
          <header>
            <h1 className="text-xl font-semibold tracking-tight">Library</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground" aria-live="polite">
              {papers.length ? (
                <>
                  <span className="tabular-nums">{plural(papers.length, "paper")}</span>
                  {/* the breakdown only earns its place when something isn't ready */}
                  {ready < papers.length && (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <span aria-hidden className="size-1.5 rounded-full bg-emerald-400" /> {ready} ready
                      </span>
                    </>
                  )}
                  {processing > 0 && (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-highlight" /> {processing} processing
                      </span>
                    </>
                  )}
                  {failed > 0 && (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums text-red-300">
                        <span aria-hidden className="size-1.5 rounded-full bg-red-400" /> {failed} failed
                      </span>
                    </>
                  )}
                </>
              ) : (
                "Add a paper to get a summary, cited answers and comparisons."
              )}
            </p>
          </header>
          <AddPaperBar />
          <PaperGrid />
        </div>
      </PageWithChat>
      <DropOverlay />
    </AppShell>
  );
}
