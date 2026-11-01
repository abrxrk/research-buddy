"use client";

import { ArrowLeft, BookOpen, FlaskConical, ListChecks, Network, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { FindingsSection } from "@/components/paper/FindingsSection";
import { KnowledgeGraphView } from "@/components/paper/KnowledgeGraphView";
import { LimitationsSection } from "@/components/paper/LimitationsSection";
import { MethodologySection } from "@/components/paper/MethodologySection";
import { OverviewSection } from "@/components/paper/OverviewSection";
import { PaperHeader } from "@/components/paper/PaperHeader";
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
    { key: "overview", label: "Overview", icon: BookOpen, body: a.overview && <OverviewSection data={a.overview} /> },
    { key: "methodology", label: "Methodology", icon: FlaskConical, body: a.methodology && <MethodologySection data={a.methodology} /> },
    { key: "findings", label: "Findings", icon: ListChecks, body: a.findings && <FindingsSection data={a.findings} /> },
    { key: "limitations", label: "Limitations", icon: TriangleAlert, body: a.limitations && <LimitationsSection data={a.limitations} /> },
    { key: "graph", label: "Knowledge graph", icon: Network, body: a.knowledge_graph && <KnowledgeGraphView data={a.knowledge_graph} /> },
  ];

  return (
    <>
      <AppHeader>
        <Link href="/dashboard" className="flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
          <ArrowLeft className="size-4" /> Library
        </Link>
      </AppHeader>
      <div className="relative flex-1">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-[420px] [mask-image:radial-gradient(ellipse_at_top_left,black_10%,transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-0 h-[380px] w-[700px] rounded-full bg-[radial-gradient(closest-side,oklch(0.88_0.17_95/0.1),transparent)] blur-2xl" />
        <main className="relative mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_400px]">
          {!loaded ? (
            <div className="space-y-4 lg:col-span-2">
              <div className="h-6 w-60 animate-pulse rounded-full bg-card" />
              <div className="h-10 w-2/3 animate-pulse rounded-xl bg-card" />
              <div className="h-64 animate-pulse rounded-2xl bg-card/60" />
            </div>
          ) : (
            <>
              <div className="min-w-0 space-y-8">
                <PaperHeader paper={loaded} />
                {loaded.status !== "failed" && (
                  <Tabs defaultValue="overview" className="gap-6">
                    <TabsList className="h-auto! w-full justify-start gap-1 overflow-x-auto rounded-full border bg-white/[0.02] p-1">
                      {tabs.map((t) => (
                        <TabsTrigger
                          key={t.key}
                          value={t.key}
                          className="h-8 flex-none gap-1.5 rounded-full px-3.5 text-[13px] data-active:bg-foreground! data-active:text-background!"
                        >
                          <t.icon className="size-3.5" /> {t.label}
                          {!t.body && processing && <span className="size-1.5 animate-pulse rounded-full bg-highlight" />}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {tabs.map((t) => (
                      <TabsContent key={t.key} value={t.key} className="animate-pop">
                        {t.body || <Pending processing={processing} />}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </div>
              <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
                <div className="h-[620px] lg:h-full">
                  <ChatPanel paperId={loaded.id} enabled={canChat(loaded.status)} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
