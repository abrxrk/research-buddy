"use client";

import { ArrowUp, MessageSquareQuote, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessageView } from "@/components/chat/ChatMessageView";
import { SourceDialog } from "@/components/chat/SourceDialog";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chatStore";
import type { Source } from "@/types";

const SUGGESTIONS = ["What problem does this paper solve?", "Summarise the main results", "What datasets were used?"];

export function ChatPanel({ paperId, enabled }: { paperId: string; enabled: boolean }) {
  const { messages, streaming, load, send, clear } = useChatStore();
  const [input, setInput] = useState("");
  const [source, setSource] = useState<Source | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load(paperId).catch(() => {});
  }, [paperId, load]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const submit = (q: string) => {
    if (!q.trim() || streaming || !enabled) return;
    setInput("");
    send(q.trim());
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card/70 backdrop-blur">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-highlight text-zinc-900">
          <MessageSquareQuote className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Ask the paper</p>
          <p className="text-[11px] text-muted-foreground">Grounded answers · cited to the page</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="xs" className="ml-auto" onClick={() => clear()} disabled={streaming}>
            <RotateCcw /> Clear
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!messages.length && (
          <div className="flex h-full flex-col justify-center gap-5 py-6">
            <div className="text-center">
              <p className="text-lg font-semibold tracking-tight">
                What do you want to <span className="font-serif font-normal italic">know?</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {enabled ? "Every answer links back to its source passage." : "Chat unlocks once the paper is indexed."}
              </p>
            </div>
            {enabled && (
              <div className="grid gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="animate-pop group flex items-center gap-3 rounded-xl border bg-white/[0.02] px-3.5 py-3 text-left text-sm transition-colors hover:border-highlight/40 hover:bg-white/[0.04]"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="font-serif text-lg text-highlight italic">“</span>
                    <span className="flex-1">{s}</span>
                    <ArrowUp className="size-3.5 rotate-45 text-muted-foreground transition-transform group-hover:rotate-90 group-hover:text-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <ChatMessageView key={i} message={m} onCite={setSource} pending={streaming && i === messages.length - 1} />
        ))}
        <div ref={bottom} />
      </div>

      <form
        className="border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <div className="flex items-end gap-2 rounded-xl border bg-background/70 p-1.5 pl-3 transition-colors focus-within:border-highlight/50 focus-within:shadow-[0_0_0_4px] focus-within:shadow-highlight/10">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={enabled ? "Ask a question about this paper…" : "Waiting for indexing…"}
            disabled={!enabled}
            rows={1}
            className="max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none [field-sizing:content] placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!enabled || streaming || !input.trim()}
            aria-label="Send"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background transition-all hover:brightness-90 disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">Enter to send · Shift + Enter for a new line</p>
      </form>
      <SourceDialog source={source} onClose={() => setSource(null)} />
    </div>
  );
}
