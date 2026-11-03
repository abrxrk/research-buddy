"use client";

import { PreviewCard } from "@base-ui/react/preview-card";
import { ChevronRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CopyButton } from "@/components/ui/copy-button";
import { TimeAgo } from "@/components/ui/time-ago";
import { plural, truncate } from "@/helpers/format";
import { cn } from "@/lib/utils";
import type { ChatMessage, Source } from "@/types";

/** Turn [1] citations into links the markdown renderer maps to source chips. Numbers that aren't one of
 *  this answer's sources (e.g. "[20]" copied from the paper's own reference list) are left as plain text. */
const linkCitations = (text: string, valid: Set<number>) =>
  text.replace(/\[(\d{1,2})\](?!\()/g, (m, n) => (valid.has(Number(n)) ? `[${n}](#cite-${n})` : m));

/** "Page 4" / "Pages 13, 14"; short: "p. 4" / "pp. 13, 14". */
export const pageLabel = (pages: string, short = false) =>
  pages.includes(",") ? `${short ? "pp." : "Pages"} ${pages.replace(/,/g, ", ")}` : `${short ? "p." : "Page"} ${pages}`;

/** "Page 4 · Introduction" (paper title is shown separately where it matters). */
const where = (s: Source) => [pageLabel(s.pages), s.section].filter(Boolean).join(" · ");

/** Strip the [n] markers so a copied answer reads cleanly outside the app. */
const plainAnswer = (m: ChatMessage) => m.content.replace(/\s?\[\d{1,2}\](?!\()/g, "").trim();

/** Yellow [n] chip: hover shows the passage, click opens it in full. */
function Citation({ n, source, onCite }: { n: number; source: Source; onCite: (s: Source) => void }) {
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={250}
        closeDelay={80}
        render={<button type="button" onClick={() => onCite(source)} aria-label={`Source ${n}: ${where(source)}`} className="chat-cite" />}
      >
        {n}
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="top" sideOffset={8} collisionPadding={12} className="z-50 outline-none">
          <PreviewCard.Popup className="popup-anim w-72 rounded-md border bg-elevated p-3 text-xs shadow-md shadow-black/30">
            <p className="flex items-baseline gap-2 text-muted-foreground">
              <span className="font-mono text-foreground">[{n}]</span>
              <span className="min-w-0 truncate">{where(source)}</span>
            </p>
            {source.paper_title && <p className="mt-1 truncate font-medium">{source.paper_title}</p>}
            <p className="mt-2 line-clamp-5 leading-relaxed text-foreground/80">{truncate(source.text, 320)}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">Click to read the full passage</p>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

type Props = {
  message: ChatMessage;
  onCite: (s: Source) => void;
  /** This answer is still being written. */
  pending?: boolean;
  /** The user stopped this answer before it finished. */
  interrupted?: boolean;
};

export function ChatMessageView({ message, onCite, pending, interrupted }: Props) {
  // Hover-only on mouse, always visible on touch (no hover there).
  const reveal = "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100";
  const time = message.created_at && <TimeAgo iso={message.created_at} className={cn("text-[11px] text-muted-foreground", reveal)} />;

  if (message.role === "user")
    return (
      <div className="group flex items-end justify-end gap-2">
        {time}
        <p className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm break-words whitespace-pre-line">{message.content}</p>
      </div>
    );

  const byN = new Map(message.sources.map((s) => [s.n, s]));
  const done = !pending && message.content;
  return (
    <div className="group space-y-2">
      <div className={cn("prose-chat text-sm leading-relaxed", pending && message.content && "chat-streaming")}>
        {message.content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const n = href?.startsWith("#cite-") ? Number(href.slice(6)) : null;
                const src = n ? byN.get(n) : undefined;
                if (!src) return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
                return <Citation n={src.n} source={src} onCite={onCite} />;
              },
            }}
          >
            {linkCitations(message.content, new Set(byN.keys()))}
          </ReactMarkdown>
        ) : (
          pending && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              {message.sources.length ? `Reading ${plural(message.sources.length, "passage")}…` : "Searching the text…"}
            </span>
          )
        )}
      </div>

      {interrupted && <p className="text-[11px] text-muted-foreground">Stopped before the answer was finished.</p>}

      {(done || message.sources.length > 0) && (
        <div className="flex items-start gap-2 text-xs">
          {message.sources.length > 0 ? (
            <details className="group/sources min-w-0 flex-1">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm py-0.5 pr-1 text-muted-foreground select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-3 transition-transform duration-150 group-open/sources:rotate-90" aria-hidden />
                {plural(message.sources.length, "source")}
              </summary>
              <ol className="mt-1.5 space-y-0.5">
                {message.sources.map((s) => (
                  <li key={s.n}>
                    <button
                      type="button"
                      onClick={() => onCite(s)}
                      className="flex w-full items-baseline gap-2 rounded-sm px-1 py-0.5 text-left text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    >
                      <span className="shrink-0 font-mono tabular-nums">[{s.n}]</span>
                      <span className="min-w-0 flex-1 truncate">
                        {s.paper_title ? <span className="text-foreground/80">{s.paper_title}</span> : s.section || "Untitled section"}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums">{pageLabel(s.pages, true)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </details>
          ) : (
            <span className="flex-1" />
          )}
          {done && (
            <span className={cn("flex shrink-0 items-center gap-1", reveal)}>
              {time}
              <CopyButton text={() => plainAnswer(message)} label="Copy answer" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
