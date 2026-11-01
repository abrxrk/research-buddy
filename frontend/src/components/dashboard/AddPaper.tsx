"use client";

import { FileUp, Link2, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePaperStore } from "@/store/paperStore";

const MAX_MB = 50;

export function AddPaper() {
  const { upload, addFromLink } = usePaperStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<"file" | "link" | null>(null);
  const [url, setUrl] = useState("");

  async function onFile(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return toast.error("Please choose a PDF file");
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`PDF must be under ${MAX_MB}MB`);
    setBusy("file");
    try {
      await upload(file);
      toast.success("Uploaded — processing has started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function onLink(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy("link");
    try {
      await addFromLink(url.trim());
      setUrl("");
      toast.success("Paper added — downloading now");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add link");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]); }}
        disabled={busy !== null}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-indigo-500 bg-indigo-50" : "hover:border-indigo-300 hover:bg-muted/40",
        )}
      >
        {busy === "file" ? <Loader2 className="size-7 animate-spin text-indigo-600" /> : <FileUp className="size-7 text-indigo-600" />}
        <span className="font-medium">Drop a PDF here or click to upload</span>
        <span className="text-xs text-muted-foreground">Up to {MAX_MB}MB</span>
        <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </button>

      <form onSubmit={onLink} className="flex flex-col justify-center gap-3 rounded-2xl border p-6">
        <div className="flex items-center gap-2 font-medium">
          <Link2 className="size-5 text-indigo-600" /> Add from a link
        </div>
        <p className="text-xs text-muted-foreground">arXiv, OpenReview, DOI, ACL Anthology, or any direct PDF link.</p>
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://arxiv.org/abs/1706.03762" className="h-9" />
          <Button type="submit" disabled={busy !== null || !url.trim()} className="h-9 bg-indigo-600 hover:bg-indigo-700">
            {busy === "link" && <Loader2 className="animate-spin" />} Add
          </Button>
        </div>
      </form>
    </div>
  );
}
