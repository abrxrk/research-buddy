"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { AppShell, PageWithChat } from "@/components/layout/AppShell";
import { SectionTabs } from "@/components/layout/SectionTabs";
import { FindingsSection } from "@/components/paper/FindingsSection";
import { KnowledgeGraphView } from "@/components/paper/KnowledgeGraphView";
import { LimitationsSection } from "@/components/paper/LimitationsSection";
import { MethodologySection } from "@/components/paper/MethodologySection";
import { OverviewSection } from "@/components/paper/OverviewSection";
import { PaperHeader } from "@/components/paper/PaperHeader";
import { Pending, type PendingKind } from "@/components/paper/Section";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { canChat, isProcessing } from "@/helpers/format";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePolling } from "@/hooks/usePolling";
import { usePaperStore } from "@/store/paperStore";

const TAB_KEYS: PendingKind[] = ["overview", "methodology", "findings", "limitations", "graph"];

/** Mirrors the header + tab strip + first paragraphs so the page doesn't jump once the paper arrives. */
function PageSkeleton() {
  return (
    <div className="space-y-8" aria-busy aria-label="Loading paper">
      <div className="space-y-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
        <div className="flex gap-3"><Skeleton className="h-4 w-14" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /></div>
        <div className="flex gap-2 pt-1"><Skeleton className="h-7 w-24" /><Skeleton className="h-7 w-32" /></div>
      </div>
      <div className="flex gap-5 border-b pb-2.5">{[16, 24, 18, 22, 26].map((w, i) => <Skeleton key={i} className="h-4" style={{ width: `${w * 4}px` }} />)}</div>
      <div className="space-y-3"><Skeleton className="h-3.5 w-48" /><Skeleton className="h-3 w-[95%]" /><Skeleton className="h-3 w-[90%]" /><Skeleton className="h-3 w-[60%]" /></div>
    </div>
  );
}

export function PaperWorkspace() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { user } = useAuth({ required: true });
  const { current: paper, fetchPaper } = usePaperStore();

  // ?tab= keeps the open tab in the URL so links and refreshes land on the same section.
  const fromUrl = params.get("tab");
  const [tab, setTab] = useState<string>(TAB_KEYS.includes(fromUrl as PendingKind) ? fromUrl! : "overview");
  const selectTab = (key: string) => {
    setTab(key);
    const url = new URL(window.location.href);
    if (key === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", key);
    window.history.replaceState(window.history.state, "", url);
  };

  // Keyed by id so navigating to another paper clears it without an extra state reset.
  const [failed, setFailed] = useState<{ id: string; message: string } | null>(null);
  const error = failed?.id === id ? failed.message : null;
  useEffect(() => {
    if (user) fetchPaper(id).catch((e) => setFailed({ id, message: e instanceof Error ? e.message : "Couldn't load this paper" }));
  }, [user, id, fetchPaper]);
  const loaded = paper?.id === id ? paper : null;
  usePolling(() => fetchPaper(id).catch(() => {}), !!loaded && isProcessing(loaded.status));
  useDocumentTitle(error ? "Paper not found" : loaded?.title);

  if (!user) return null;
  const a = loaded?.analysis ?? {};
  const processing = !!loaded && isProcessing(loaded.status);
  const make = (key: PendingKind, label: string, body: React.ReactNode, count?: number) => ({
    key, label, count: body ? count : undefined, busy: !body && processing, body: body || <Pending processing={processing} kind={key} />,
  });

  return (
    <AppShell>
      {!loaded && error ? (
        <EmptyState icon={FileQuestion} title="This paper isn't in your library" description={error} className="py-24">
          <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>Back to library</Link>
        </EmptyState>
      ) : !loaded ? (
        <PageWithChat chat={<Skeleton className="h-full rounded-lg" />}>
          <PageSkeleton />
        </PageWithChat>
      ) : (
        <PageWithChat chat={<ChatPanel chatPath={`/papers/${loaded.id}/chat`} enabled={canChat(loaded.status)} />}>
          {/* @container: section grids split by the real column width, not the viewport (chat panel takes 380px). */}
          <div className="@container space-y-8">
            <PaperHeader paper={loaded} />
            {loaded.status !== "failed" && (
              <SectionTabs
                value={tab}
                onValueChange={selectTab}
                hotkeys
                tabs={[
                  make("overview", "Overview", a.overview && <OverviewSection data={a.overview} />),
                  make("methodology", "Methodology", a.methodology && <MethodologySection data={a.methodology} />),
                  make("findings", "Findings", a.findings && <FindingsSection data={a.findings} />, a.findings?.results.length),
                  make("limitations", "Limitations", a.limitations && <LimitationsSection data={a.limitations} />, a.limitations?.limitations.length),
                  make("graph", "Concept map", a.knowledge_graph && <KnowledgeGraphView data={a.knowledge_graph} />, a.knowledge_graph?.nodes.length),
                ]}
              />
            )}
          </div>
        </PageWithChat>
      )}
    </AppShell>
  );
}
