import { Reveal } from "@/components/common/Reveal";

export function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-highlight" /> {eyebrow}
      </p>
      <h2 className="text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-5xl">{title}</h2>
      {sub && <p className="mt-5 text-muted-foreground sm:text-lg">{sub}</p>}
    </Reveal>
  );
}
