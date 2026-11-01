import { cn } from "@/lib/utils";
import type { PaperStatus } from "@/types";

const LINES = [92, 84, 96, 70, 0, 88, 94, 62];

/** Miniature "paper page" preview; scans while processing, highlights once ready. */
export function PaperThumb({ title, status }: { title: string; status: PaperStatus }) {
  const ready = status === "ready";
  const failed = status === "failed";
  return (
    <div className="bg-dots relative flex h-40 items-end justify-center overflow-hidden border-b bg-white/[0.015] pt-6">
      <div
        className={cn(
          "relative h-36 w-[62%] rotate-[-2deg] rounded-t-md bg-zinc-100 px-4 pt-4 shadow-[0_-10px_40px_-10px_rgb(0_0_0/0.6)] transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-0",
          failed && "grayscale opacity-50",
        )}
      >
        <p className="line-clamp-2 text-center font-serif text-[13px] leading-tight text-zinc-900">{title}</p>
        <div className="mx-auto mt-1.5 mb-3 h-[3px] w-1/2 rounded-full bg-zinc-300" />
        <div className="space-y-[5px]">
          {LINES.map((w, i) =>
            w === 0 ? (
              <div key={i} className="h-1" />
            ) : (
              <div key={i} className="relative h-[4px]" style={{ width: `${w}%` }}>
                {ready && (i === 1 || i === 6) && (
                  <div className="absolute -inset-x-0.5 -inset-y-[2px] origin-left scale-x-0 rounded-sm bg-highlight/80 transition-transform delay-100 duration-700 group-hover:scale-x-100" />
                )}
                <div className="relative h-full rounded-full bg-zinc-300" />
              </div>
            ),
          )}
        </div>
        {!ready && !failed && (
          <div className="animate-scan absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-highlight/40 to-transparent" />
        )}
      </div>
    </div>
  );
}
