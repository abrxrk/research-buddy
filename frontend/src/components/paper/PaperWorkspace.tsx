"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AppHeader } from "@/components/layout/AppHeader";
import { FindingsSection } from "@/components/paper/FindingsSection";
import { KnowledgeGraphView } from "@/components/paper/KnowledgeGraphView";
import { LimitationsSection } from "@/components/paper/LimitationsSection";
import { MethodologySection } from "@/components/paper/MethodologySection";
import { OverviewSection } from "@/components/paper/OverviewSection";
import { ProcessingSteps } from "@/components/paper/ProcessingSteps";
import { Pending } from "@/components/paper/Section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canChat, isProcessing } from "@/helpers/format";
import { useAuth } from "@/hooks/useAuth";
import { usePolling } from "@/hooks/usePolling";
import { usePaperStore } from "@/store/paperStore";

export function PaperWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth({ required: true });
  const { current: paper, fetchPaper } = usePaperStore();

  useEffect(() => {
    if (user) fetchPaper(id).catch((e) => toast.error(e.message));
  }, [user, id, fetchPaper]);
  const loaded = paper?.id === id ? paper : null;
  usePolling(() => fetchPaper(id).catch(() => {}), !!loaded && isProcessing(loaded.status));

  if (!user) return null;
  const a = loaded?.analysis ?? {};
  const processing = !!loaded && isProcessing(loaded.status);
  const tabs = [
    { key: "overview", label: "Overview", body: a.overview && <OverviewSection data={a.overview} /> },
    { key: "methodology", label: "Methodology", body: a.methodology && <MethodologySection data={a.methodology} /> },
    { key: "findings", label: "Findings", body: a.findings && <FindingsSection data={a.findings} /> },
    { key: "limitations", label: "Limitations", body: a.limitations && <LimitationsSection data={a.limitations} /> },
    { key: "graph", label: "Knowledge graph", body: a.knowledge_graph && <KnowledgeGraphView data={a.knowledge_graph} /> },
  ];

  return (
    <>
      <AppHeader>
        <Link href="/dashboard" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Library
        </Link>
      </AppHeader>
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_420px]">
        {!loaded ? (
          <div className="h-40 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
        ) : (
          <>
            <div className="min-w-0 space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={loaded.status} />
                  <span className="capitalize">{loaded.source}</span>
                  {loaded.page_count && <span>· {loaded.page_count} pages</span>}
                  {loaded.url && (
                    <a href={loaded.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                      · Source <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-balance">{loaded.title}</h1>
                {processing && <ProcessingSteps status={loaded.status} />}
                {loaded.error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{loaded.error}</p>}
              </div>

              {loaded.status !== "failed" && (
                <Tabs defaultValue="overview">
                  <TabsList variant="line" className="w-full justify-start overflow-x-auto">
                    {tabs.map((t) => <TabsTrigger key={t.key} value={t.key} className="flex-none">{t.label}</TabsTrigger>)}
                  </TabsList>
                  {tabs.map((t) => (
                    <TabsContent key={t.key} value={t.key} className="pt-4">
                      {t.body || <Pending processing={processing} />}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6.5rem)]">
              <div className="h-[600px] lg:h-full">
                <ChatPanel paperId={loaded.id} enabled={canChat(loaded.status)} />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
