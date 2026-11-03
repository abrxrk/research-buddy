"use client";

import { Ban, FileUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MAX_PDF_MB, useAddPaper } from "@/hooks/useAddPaper";
import { cn } from "@/lib/utils";

const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files") ?? false;

/** What's being dragged, as far as the browser tells us before the drop. */
function inspect(e: DragEvent): { count: number; allPdf: boolean } {
  const items = Array.from(e.dataTransfer?.items ?? []).filter((i) => i.kind === "file");
  // Some browsers hide types until the drop; treat unknown as PDF so we don't refuse a valid file
  return { count: items.length, allPdf: items.every((i) => !i.type || i.type === "application/pdf") };
}

/** Full-screen drop target: drag PDFs anywhere on the page to upload them. */
export function DropOverlay() {
  const { uploadFile } = useAddPaper();
  const [drag, setDrag] = useState<{ count: number; allPdf: boolean } | null>(null);
  const upload = useRef(uploadFile);
  useEffect(() => {
    upload.current = uploadFile;
  });

  useEffect(() => {
    let depth = 0; // dragenter/leave fire for every child element
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setDrag(inspect(e));
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setDrag(null);
    };
    const over = (e: DragEvent) => hasFiles(e) && e.preventDefault();
    const drop = async (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDrag(null);
      for (const file of Array.from(e.dataTransfer?.files ?? [])) await upload.current(file);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, []);

  if (!drag) return null;
  const bad = !drag.allPdf;
  const Icon = bad ? Ban : FileUp;
  return (
    <div role="status" aria-live="assertive" className="pointer-events-none fixed inset-0 z-50 bg-background/85 p-4 backdrop-blur-xs">
      <div className={cn("grid h-full w-full place-items-center rounded-lg border-2 border-dashed transition-colors", bad ? "border-red-400/60" : "border-highlight/70")}>
        <div className="flex flex-col items-center text-center">
          <span className={cn("mb-4 grid size-12 place-items-center rounded-lg border bg-card", bad ? "text-red-300" : "text-highlight")}>
            <Icon className="size-5" aria-hidden />
          </span>
          <p className="text-lg font-medium">
            {bad ? "Only PDF files can be added" : drag.count > 1 ? `Drop ${drag.count} PDFs to add them` : "Drop the PDF to add it to your library"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {bad ? "Paste a link in the box above instead." : `Up to ${MAX_PDF_MB} MB each. Each paper is read and summarised automatically.`}
          </p>
        </div>
      </div>
    </div>
  );
}
