"use client";

import { ArrowUp, MessageSquareQuote, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessageView } from "@/components/chat/ChatMessageView";
import { SourceDialog } from "@/components/chat/SourceDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="flex h-full flex-col rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquareQuote className="size-4 text-indigo-600" />
        <span className="font-medium">Ask the paper</span>
        {messages.length > 0 && (
          <Button variant="ghost" size="xs" className="ml-auto" onClick={() => clear()} disabled={streaming}>
            <RotateCcw /> Clear
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!messages.length && (
          <div className="space-y-3 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {enabled ? "Answers cite the exact page and section." : "Chat unlocks once the paper is indexed."}
            </p>
            {enabled && (
              <div className="flex flex-col items-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-full border px-3 py-1 text-xs hover:border-indigo-300 hover:bg-indigo-50">
                    {s}
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
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <Textarea
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
          className="max-h-32 min-h-9 resize-none"
        />
        <Button type="submit" size="icon" disabled={!enabled || streaming || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700" aria-label="Send">
          <ArrowUp />
        </Button>
      </form>
      <SourceDialog source={source} onClose={() => setSource(null)} />
    </div>
  );
}
