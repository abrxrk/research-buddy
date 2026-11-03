"use client";

/* eslint-disable @next/next/no-img-element -- small local logo SVGs */
import { Link2, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tip } from "@/components/ui/tooltip";
import { detectSource } from "@/helpers/source";
import { MAX_PDF_MB, useAddPaper } from "@/hooks/useAddPaper";
import { isTyping } from "@/hooks/useHotkey";

export const EXAMPLES = [
  ["Attention Is All You Need", "https://arxiv.org/abs/1706.03762"],
  ["BERT", "https://aclanthology.org/N19-1423/"],
  ["ResNet", "https://arxiv.org/abs/1512.03385"],
];

/** The link box's text, shared so other parts of the page (e.g. the empty state) can fill it. */
export const useLinkDraft = create<{ url: string; set: (url: string) => void }>()((set) => ({ url: "", set: (url) => set({ url }) }));

/** Fill the link box with an example and focus it. */
export function pickExample(link = EXAMPLES[0][1]) {
  useLinkDraft.getState().set(link);
  document.getElementById("paper-link")?.focus();
}

export function AddPaperBar() {
  const { busy, uploadFile, addLink } = useAddPaper();
  const { url, set: setUrl } = useLinkDraft();
  const [touched, setTouched] = useState(false); // only flag a bad link after blur/submit, not mid-typing
  const input = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const source = detectSource(url);
  const invalid = url.trim().length > 0 && !source;
  const showInvalid = invalid && touched;

  // Paste a link anywhere on the page (outside inputs) to fill this box
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTyping(e.target)) return;
      const text = e.clipboardData?.getData("text")?.trim() ?? "";
      if (!text || !detectSource(text)) return;
      e.preventDefault();
      setUrl(text);
      setTouched(false);
      input.current?.focus();
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [setUrl]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (invalid) {
      setTouched(true);
      input.current?.focus();
      return;
    }
    if (await addLink(url)) {
      setUrl("");
      setTouched(false);
    }
  }

  function pick(link: string) {
    setUrl(link);
    setTouched(false);
    input.current?.focus();
  }

  return (
    <section aria-label="Add a paper" className="space-y-2">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label
          className={
            "flex h-9 flex-1 items-center gap-2 rounded-md border bg-card px-3 transition-colors focus-within:border-ring " +
            (showInvalid ? "border-red-400/60" : "")
          }
        >
          <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="sr-only">Paper link</span>
          <input
            id="paper-link"
            ref={input}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTouched(false);
            }}
            onBlur={() => url && setTouched(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault(); // keep the global Esc (clear selection) out of it
                setUrl("");
                setTouched(false);
              }
            }}
            placeholder="Paste an arXiv, DOI or PDF link"
            autoComplete="off"
            enterKeyHint="go"
            spellCheck={false}
            inputMode="url"
            aria-invalid={showInvalid || undefined}
            aria-describedby="add-paper-hint"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {source && (
            <span className="flex h-5 shrink-0 items-center gap-1.5 rounded-sm bg-muted px-1.5 text-xs text-muted-foreground">
              {source.logo && <img src={source.logo} alt="" className="size-3" />}
              {source.label}
            </span>
          )}
          {url && (
            <Tip content="Clear" shortcut="escape">
              <button
                type="button"
                onClick={() => pick("")}
                aria-label="Clear link"
                className="grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </Tip>
          )}
        </label>
        <Button type="submit" variant="accent" size="lg" className="px-4" disabled={!url.trim() || busy !== null}>
          {busy === "link" && <Loader2 className="animate-spin" />} Add paper
        </Button>
        <Tip content={`PDF up to ${MAX_PDF_MB} MB. You can also drop one anywhere on this page.`}>
          <Button type="button" variant="outline" size="lg" className="px-3.5" onClick={() => fileInput.current?.click()} disabled={busy !== null}>
            {busy === "file" ? <Loader2 className="animate-spin" /> : <Upload />} Upload PDF
          </Button>
        </Tip>
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
      <p id="add-paper-hint" className="text-xs text-muted-foreground" aria-live="polite">
        {showInvalid ? (
          <span className="text-red-300">That doesn&apos;t look like a paper link. Try an arXiv, DOI, OpenReview or ACL Anthology page, or a direct link to a PDF.</span>
        ) : (
          <>
            Drop a PDF anywhere on this page, or press <Kbd combo="mod+v" /> to paste a link. Try:{" "}
            {EXAMPLES.map(([name, link], i) => (
              <span key={link}>
                <Tip content={link}>
                  <button
                    type="button"
                    onClick={() => pick(link)}
                    className="rounded-sm text-foreground/80 underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
                  >
                    {name}
                  </button>
                </Tip>
                {i < EXAMPLES.length - 1 && ", "}
              </span>
            ))}
          </>
        )}
      </p>
    </section>
  );
}
