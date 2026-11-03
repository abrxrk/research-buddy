"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { Section } from "@/components/paper/Section";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { plural } from "@/helpers/format";
import { cn } from "@/lib/utils";
import type { Overview } from "@/types";

export function OverviewSection({ data }: { data: Overview }) {
  const [full, setFull] = useState(false);
  // "Read more" only when the clamp actually hides text; measured, so it tracks the column width.
  const abstractRef = useRef<HTMLParagraphElement>(null);
  const [long, setLong] = useState(false);
  useLayoutEffect(() => {
    const el = abstractRef.current;
    if (!el || full) return;
    const check = () => setLong(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [full, data.abstract]);
  const words = data.abstract ? data.abstract.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-10">
      {data.objective && (
        <Section title="What the paper sets out to do">
          <p className="text-base leading-relaxed text-pretty">{data.objective}</p>
        </Section>
      )}

      <Section
        title="Key contributions"
        count={data.contributions.length || undefined}
        description="What the authors say is new in this work."
        aside={data.contributions.length > 0 && <CopyButton text={() => data.contributions.map((c, i) => `${i + 1}. ${c}`).join("\n")} label="Copy as list" />}
      >
        {data.contributions.length ? (
          <ol className="space-y-2.5">
            {data.contributions.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 w-5 shrink-0 font-mono text-xs leading-relaxed text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-pretty">{c}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">None found.</p>
        )}
      </Section>

      <Section
        title="Abstract"
        description={words ? `${plural(words, "word")}, as written by the authors.` : undefined}
        aside={data.abstract && <CopyButton text={data.abstract} label="Copy abstract" />}
      >
        {data.abstract ? (
          <>
            <p ref={abstractRef} className={cn("text-muted-foreground", full ? "whitespace-pre-line" : "line-clamp-5")}>{data.abstract}</p>
            {(long || full) && (
              <Button variant="ghost" size="xs" onClick={() => setFull((f) => !f)} aria-expanded={full} className="mt-2 -ml-2 text-muted-foreground">
                {full ? "Show less" : "Read the full abstract"}
              </Button>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Not found in the paper.</p>
        )}
      </Section>
    </div>
  );
}
