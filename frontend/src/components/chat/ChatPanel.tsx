"use client";

import "./chat.css";

import { Popover } from "@base-ui/react/popover";
import { AlertCircle, ArrowDown, ArrowUp, MessageSquare, RotateCcw, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessageView } from "@/components/chat/ChatMessageView";
import { SourceDialog } from "@/components/chat/SourceDialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { Tip } from "@/components/ui/tooltip";
import { plural } from "@/helpers/format";
import { useHotkey } from "@/hooks/useHotkey";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import type { Source } from "@/types";

const PAPER_SUGGESTIONS = ["What problem does this paper solve?", "Summarise the main results", "What datasets were used?"];
const MAX_LEN = 2000; // matches the backend's question limit

type Props = {
  chatPath: string;
  enabled: boolean;
  title?: string;
  description?: string;
  subject?: string; // placeholder: "Ask a question about {subject}"
  disabledHint?: string;
  suggestions?: string[];
};

export function ChatPanel({
  chatPath,
  enabled,
  title = "Ask about this paper",
  description = "Answers use only this paper and cite the page they come from.",
  subject = "this paper",
  disabledHint = "Questions open once the paper has been indexed.",
  suggestions = PAPER_SUGGESTIONS,
}: Props) {
  const { messages, loading, streaming, error, interrupted, load, send, stop, retry, clear } = useChatStore();
  const [input, setInput] = useState("");
  const [source, setSource] = useState<Source | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [asked, setAsked] = useState(false); // only announce "Answer ready" for questions asked in this session
  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true); // follow new tokens unless the user scrolled up

  useEffect(() => {
    load(chatPath);
  }, [chatPath, load]);

  // Scroll only inside the panel, never the page; stop following once the user scrolls up.
  useEffect(() => {
    if (stick.current) scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: streaming || !asked ? "auto" : "smooth" });
  }, [messages, streaming, error, asked]);

  useHotkey("mod+j", () => textarea.current?.focus(), { allowInInput: true });

  const stopAndRefocus = () => {
    stop();
    textarea.current?.focus(); // the Stop button unmounts, so put focus somewhere useful
  };

  const onScroll = () => {
    const el = scroller.current!;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    stick.current = bottom;
    setAtBottom(bottom);
  };
  const jumpToLatest = () => {
    stick.current = true;
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  };

  const submit = (q: string) => {
    const question = q.trim();
    if (!question || streaming || !enabled) return;
    setInput("");
    setAsked(true);
    stick.current = true;
    send(question);
    textarea.current?.focus();
  };

  const lastQuestion = messages.findLast((m) => m.role === "user")?.content;
  const remaining = MAX_LEN - input.length;
  const canSend = enabled && !streaming && input.trim().length > 0;
  // Screen-reader announcements; the streamed text itself is too chatty to be live.
  const status = streaming ? "Searching the text and writing an answer" : error ? `Failed: ${error.message}` : asked ? "Answer ready" : "";

  return (
    <section
      className="flex h-full flex-col rounded-lg border bg-card xl:rounded-none xl:border-0 xl:bg-card/40"
      aria-label={title}
      onKeyDown={(e) => {
        // Esc stops the answer only while focus is inside the panel, so closing a dialog or toast elsewhere doesn't abort it.
        if (e.key === "Escape" && streaming) {
          e.preventDefault();
          stopAndRefocus();
        }
      }}
    >
      <header className="flex items-start gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{description}</p>
        </div>
        {messages.length > 0 && (
          <Popover.Root open={confirmClear} onOpenChange={setConfirmClear}>
            <Tip content="Clear chat">
              <Popover.Trigger
                disabled={streaming}
                render={<Button variant="ghost" size="icon-xs" aria-label="Clear chat" className="-mr-1 text-muted-foreground" />}
              >
                <Trash2 aria-hidden />
              </Popover.Trigger>
            </Tip>
            <Popover.Portal>
              <Popover.Positioner side="bottom" align="end" sideOffset={6} collisionPadding={8} className="z-50 outline-none">
                <Popover.Popup className="popup-anim w-60 rounded-md border bg-elevated p-3 text-xs shadow-md shadow-black/30">
                  <Popover.Title className="font-medium">Clear this chat?</Popover.Title>
                  <Popover.Description className="mt-1 text-muted-foreground">
                    {plural(messages.length, "message")} will be deleted. This can&apos;t be undone.
                  </Popover.Description>
                  <div className="mt-3 flex justify-end gap-1.5">
                    <Popover.Close render={<Button variant="ghost" size="xs" />}>Cancel</Popover.Close>
                    <Button variant="destructive" size="xs" onClick={() => { setConfirmClear(false); clear(); }}>
                      Clear
                    </Button>
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="scroll-shadow-y h-full space-y-6 overflow-y-auto px-4 py-4"
        >
          {loading && (
            <div className="space-y-6" aria-hidden>
              <Skeleton className="ml-auto h-8 w-3/5 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-3.5 w-4/6" />
              </div>
            </div>
          )}

          {!loading && !messages.length && (
            enabled ? (
              <div className="flex min-h-full flex-col justify-center py-4 text-sm">
                <span className="grid size-9 place-items-center rounded-md border bg-background">
                  <MessageSquare className="size-4 text-highlight" aria-hidden />
                </span>
                <p className="mt-4 font-medium">Ask a question about {subject}</p>
                <p className="mt-1 text-pretty text-muted-foreground">
                  Answers are written only from the text, and each point links to the page it came from.
                </p>

                <p className="mt-6 text-xs text-muted-foreground">Try asking</p>
                <ul className="mt-2 space-y-1.5">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => submit(s)}
                        className="group flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-muted-foreground transition-colors duration-150 hover:border-highlight/40 hover:bg-muted/40 hover:text-foreground"
                      >
                        <span className="flex-1">{s}</span>
                        <ArrowUp className="size-3.5 rotate-45 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex min-h-full flex-col justify-center text-sm">
                <span className="grid size-9 place-items-center rounded-md border bg-background">
                  <MessageSquare className="size-4 text-muted-foreground" aria-hidden />
                </span>
                <p className="mt-4 text-pretty text-muted-foreground">{disabledHint}</p>
              </div>
            )
          )}

          {messages.map((m, i) => {
            const last = i === messages.length - 1;
            return <ChatMessageView key={`${m.created_at ?? ""}-${i}`} message={m} onCite={setSource} pending={streaming && last} interrupted={interrupted && last} />;
          })}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{error.question ? "Couldn’t get an answer" : "Couldn’t load this chat"}</p>
                <p className="mt-0.5 text-pretty text-muted-foreground">{error.message}</p>
              </div>
              <Button variant="ghost" size="xs" onClick={retry} className="-mr-1 shrink-0">
                <RotateCcw aria-hidden /> Retry
              </Button>
            </div>
          )}
        </div>

        {!atBottom && messages.length > 0 && (
          <Button
            variant="outline"
            size="xs"
            onClick={jumpToLatest}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full shadow-md shadow-black/30"
          >
            <ArrowDown aria-hidden /> {streaming ? "Follow answer" : "Jump to latest"}
          </Button>
        )}
      </div>

      <form
        className="border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <div
          className={cn(
            "flex items-end gap-2 rounded-md border bg-background px-3 py-1.5 transition-colors duration-150 focus-within:border-ring",
            remaining < 0 && "border-red-500/60",
          )}
        >
          <textarea
            ref={textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // On touch, Enter adds a line and the Send button sends.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                submit(input);
              } else if (e.key === "ArrowUp" && !input && lastQuestion) {
                // Recall the previous question to tweak it, like a shell.
                e.preventDefault();
                setInput(lastQuestion);
              }
            }}
            aria-label="Your question"
            aria-invalid={remaining < 0 || undefined}
            aria-describedby={remaining < 0 ? "chat-hint chat-count" : "chat-hint"}
            placeholder={enabled ? `Ask a question about ${subject}` : "Not available yet"}
            disabled={!enabled}
            rows={1}
            className="max-h-32 min-h-7 flex-1 resize-none bg-transparent py-1 text-sm outline-none [field-sizing:content] placeholder:text-muted-foreground disabled:opacity-50"
          />
          {remaining <= 200 && (
            <span
              id="chat-count"
              className={cn("mb-1.5 font-mono text-[11px] tabular-nums", remaining < 0 ? "text-red-400" : "text-muted-foreground")}
              aria-label={remaining < 0 ? `${-remaining} characters over the ${MAX_LEN} limit` : `${remaining} characters left`}
            >
              {remaining}
            </span>
          )}
          {streaming ? (
            <Tip content="Stop generating" shortcut="escape">
              <Button type="button" variant="outline" size="icon-sm" onClick={stopAndRefocus} aria-label="Stop generating" className="mb-0.5 shrink-0">
                <Square className="size-3 fill-current" aria-hidden />
              </Button>
            </Tip>
          ) : (
            <Tip content="Send" shortcut="enter">
              <Button type="submit" variant="accent" size="icon-sm" disabled={!canSend || remaining < 0} aria-label="Send question" className="mb-0.5 shrink-0">
                <ArrowUp aria-hidden />
              </Button>
            </Tip>
          )}
        </div>
        <p id="chat-hint" className="mt-2 hidden items-center gap-1 text-[11px] text-muted-foreground pointer-fine:flex">
          <Kbd>Enter</Kbd> to send, <Kbd combo="shift+enter" /> for a new line
          <span className="ml-auto inline-flex items-center gap-1"><Kbd combo="mod+j" /> to focus</span>
        </p>
        <p className="sr-only" aria-live="polite">{status}</p>
      </form>
      <SourceDialog source={source} onClose={() => setSource(null)} />
    </section>
  );
}
