"use client";

import { useState } from "react";
import { toast } from "sonner";

import { usePaperStore } from "@/store/paperStore";

export const MAX_PDF_MB = 50;

/** Upload / add-by-link with validation and toasts. Shared by the add bar and the page-wide drop zone. */
export function useAddPaper() {
  const { upload, addFromLink } = usePaperStore();
  const [busy, setBusy] = useState<"file" | "link" | null>(null);

  async function uploadFile(file?: File) {
    if (!file || busy) return false;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please choose a PDF file");
      return false;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      toast.error(`PDF must be under ${MAX_PDF_MB}MB`);
      return false;
    }
    setBusy("file");
    try {
      await upload(file);
      toast.success("Uploaded — reading the paper now");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function addLink(url: string) {
    if (!url.trim() || busy) return false;
    setBusy("link");
    try {
      await addFromLink(url.trim());
      toast.success("Paper added — downloading now");
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
