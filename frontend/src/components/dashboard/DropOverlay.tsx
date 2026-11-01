"use client";

import { FileUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAddPaper } from "@/hooks/useAddPaper";

const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files") ?? false;

/** Full-screen drop target: drag a PDF anywhere on the page to upload it. */
export function DropOverlay() {
  const { uploadFile } = useAddPaper();
  const [active, setActive] = useState(false);
  const upload = useRef(uploadFile);
  useEffect(() => {
    upload.current = uploadFile;
  });

  useEffect(() => {
    let depth = 0; // dragenter/leave fire for every child element
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setActive(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setActive(false);
    };
    const over = (e: DragEvent) => hasFiles(e) && e.preventDefault();
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setActive(false);
      upload.current(e.dataTransfer?.files[0]);
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

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-background/80 p-6 backdrop-blur-sm">
      <div className="animate-pop grid h-full w-full place-items-center rounded-3xl border-2 border-dashed border-highlight/60 bg-highlight/[0.03]">
        <div className="text-center">
          <span className="mx-auto mb-5 grid size-16 animate-float place-items-center rounded-2xl bg-highlight text-zinc-900">
            <FileUp className="size-7" />
          </span>
          <p className="text-2xl font-semibold tracking-tight">
            Drop to <span className="font-serif font-normal italic">start reading</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">PDF up to 50MB</p>
        </div>
      </div>
    </div>
  );
}
