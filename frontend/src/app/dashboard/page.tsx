"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { AddPaper } from "@/components/dashboard/AddPaper";
import { PaperList } from "@/components/dashboard/PaperList";
import { AppHeader } from "@/components/layout/AppHeader";
import { isProcessing } from "@/helpers/format";
import { useAuth } from "@/hooks/useAuth";
import { usePolling } from "@/hooks/usePolling";
import { usePaperStore } from "@/store/paperStore";

export default function DashboardPage() {
  const { user } = useAuth({ required: true });
  const { papers, fetchPapers } = usePaperStore();

  useEffect(() => {
    if (user) fetchPapers().catch((e) => toast.error(e.message));
  }, [user, fetchPapers]);
  usePolling(() => fetchPapers().catch(() => {}), papers.some((p) => isProcessing(p.status)));

  if (!user) return null;
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Your papers</h1>
        <p className="mb-6 text-muted-foreground">Add a paper to generate insights and chat with it.</p>
        <AddPaper />
        <h2 className="mt-10 mb-4 font-medium">Library</h2>
        <PaperList />
      </main>
    </>
  );
}
