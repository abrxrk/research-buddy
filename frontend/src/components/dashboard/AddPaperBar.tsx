"use client";

/* eslint-disable @next/next/no-img-element -- small local logo SVGs */
import { ArrowRight, Link2, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { GlowCard } from "@/components/common/GlowCard";
import { detectSource } from "@/helpers/source";
import { MAX_PDF_MB, useAddPaper } from "@/hooks/useAddPaper";

const EXAMPLES = [
  ["Attention Is All You Need", "https://arxiv.org/abs/1706.03762"],
  ["BERT", "https://aclanthology.org/N19-1423/"],
  ["ResNet", "https://arxiv.org/abs/1512.03385"],
];

export function AddPaperBar() {
  const { busy, uploadFile, addLink } = useAddPaper();
  const [url, setUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const source = detectSource(url);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (await addLink(url)) setUrl("");
  }

  return (
    <GlowCard className="animate-pop overflow-hidden" >
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative p-5 sm:p-6">
        <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border bg-background/80 px-4 transition-colors focus-within:border-highlight/50 focus-within:shadow-[0_0_0_4px] focus-within:shadow-highlight/10">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste an arXiv, DOI, OpenReview or PDF link…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Paper link"
            />
            {source && (
              <span key={source.key} className="animate-pop flex shrink-0 items-center gap-1.5 rounded-full border bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
                {source.logo ? <img src={source.logo} alt="" className="size-3" /> : <span className="size-1.5 rounded-full bg-highlight" />}
                {source.label}
              </span>
            )}
          </label>
          <button
            type="submit"
            disabled={!url.trim() || busy !== null}
            className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-all hover:brightness-90 disabled:opacity-40"
          >
            {busy === "link" ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
            Add paper
          </button>
          <span className="hidden items-center text-xs text-muted-foreground md:flex">or</span>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border bg-white/[0.02] px-5 text-sm transition-colors hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-40"
          >
            {busy === "file" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Upload PDF
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={async (e) => {
              await uploadFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Try:</span>
          {EXAMPLES.map(([name, link]) => (
            <button
              key={link}
              type="button"
              onClick={() => setUrl(link)}
              className="rounded-full border px-2.5 py-1 transition-colors hover:border-highlight/40 hover:text-foreground"
            >
              {name}
            </button>
          ))}
          <span className="ml-auto hidden sm:inline">Tip: drop a PDF anywhere on this page · up to {MAX_PDF_MB}MB</span>
        </div>
      </div>
    </GlowCard>
  );
}
