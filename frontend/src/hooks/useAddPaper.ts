"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { create } from "zustand";

import { usePaperStore } from "@/store/paperStore";
import type { Paper } from "@/types";

export const MAX_PDF_MB = 50;

export const isPdfFile = (file: File) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

// ponytail: loose string match on the saved url; the backend may store a resolved url, so this only catches exact re-pastes
const normalizeUrl = (s: string) => s.trim().replace(/^https?:\/\/(www\.)?/i, "").replace(/\/+$/, "").toLowerCase();

type Busy = "file" | "link" | null;
// shared so the add bar and the drop zone can't start two uploads at once
const useBusy = create<{ busy: Busy; set: (b: Busy) => void }>()((set) => ({ busy: null, set: (busy) => set({ busy }) }));

/** Upload / add-by-link with validation and toasts. Shared by the add bar and the page-wide drop zone. */
export function useAddPaper() {
  const { papers, upload, addFromLink } = usePaperStore();
  const router = useRouter();
  const { busy, set: setBusy } = useBusy();

  const openAction = (p: Paper) => ({ label: "Open", onClick: () => router.push(`/papers/${p.id}`) });

  async function uploadFile(file?: File) {
    if (!file || busy) return false;
    if (!isPdfFile(file)) {
      toast.error("Only PDF files can be added", { description: file.name });
      return false;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      toast.error(`PDF must be under ${MAX_PDF_MB} MB`, { description: `${file.name} is ${(file.size / 1024 / 1024).toFixed(0)} MB` });
      return false;
    }
    setBusy("file");
    try {
      const paper = await upload(file);
      toast.success("Uploaded — reading the paper now", { description: file.name, action: openAction(paper) });
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function addLink(url: string) {
    const trimmed = url.trim();
    if (!trimmed || busy) return false;
    const existing = papers.find((p) => p.url && normalizeUrl(p.url) === normalizeUrl(trimmed));
    if (existing) {
      toast("Already in your library", { description: existing.title, action: openAction(existing) });
      return true;
    }
    setBusy("link");
    try {
      const paper = await addFromLink(trimmed);
      toast.success("Paper added — downloading now", { action: openAction(paper) });
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add link");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return { busy, uploadFile, addLink };
}
