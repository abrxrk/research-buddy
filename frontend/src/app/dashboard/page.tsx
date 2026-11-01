"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { AddPaperBar } from "@/components/dashboard/AddPaperBar";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DropOverlay } from "@/components/dashboard/DropOverlay";
import { PaperGrid } from "@/components/dashboard/PaperGrid";
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
      <div className="relative flex-1">
        {/* same aurora + dot grid as the landing page */}
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-[520px] [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.88_0.17_95/0.12),transparent)] blur-2xl" />
        <main className="relative mx-auto w-full max-w-7xl space-y-10 px-6 py-12">
          <DashboardHero user={user} papers={papers} />
          <AddPaperBar />
          <PaperGrid />
        </main>
      </div>
      <DropOverlay />
    </>
  );
}
