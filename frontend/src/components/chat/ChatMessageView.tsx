"use client";

import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import type { ChatMessage, Source } from "@/types";

/** Turn [1] citations into links the markdown renderer maps to source chips. */
const linkCitations = (text: string) => text.replace(/\[(\d{1,2})\](?!\()/g, "[$1](#cite-$1)");

export function ChatMessageView({ message, onCite, pending }: { message: ChatMessage; onCite: (s: Source) => void; pending?: boolean }) {
  if (message.role === "user")
    return <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-foreground px-3.5 py-2 text-sm text-background">{message.content}</div>;

  const byN = new Map(message.sources.map((s) => [s.n, s]));
  return (
    <div className="max-w-[95%] space-y-2">
      <div className="prose-chat rounded-2xl rounded-bl-sm border bg-white/[0.03] px-3.5 py-2.5 text-sm leading-relaxed">
        {message.content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const n = href?.startsWith("#cite-") ? Number(href.slice(6)) : null;
                const src = n ? byN.get(n) : undefined;
                if (!src) return <a href={href} target="_blank" rel="noreferrer" className="underline">{children}</a>;
                return (
                  <button
                    onClick={() => onCite(src)}
                    title={`Page ${src.pages} · ${src.section}`}
                    className="mx-0.5 inline-flex h-4.5 items-center rounded bg-highlight px-1 align-text-top font-mono text-[11px] font-medium text-zinc-900 hover:brightness-110"
                  >
                    {n}
                  </button>
                );
              },
            }}
          >
            {linkCitations(message.content)}
          </ReactMarkdown>
        ) : (
          pending && <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Searching the paper…</span>
        )}
      </div>
      {message.sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {message.sources.map((s) => (
            <button
              key={s.n}
              onClick={() => onCite(s)}
              className={cn("max-w-full truncate rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:border-white/30 hover:text-foreground")}
            >
              [{s.n}] p.{s.pages}{s.section && ` · ${s.section}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
