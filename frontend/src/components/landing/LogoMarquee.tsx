/* eslint-disable @next/next/no-img-element -- tiny local SVGs, next/image adds nothing here */
const LOGOS = [
  ["nextdotjs", "Next.js"],
  ["typescript", "TypeScript"],
  ["tailwindcss", "Tailwind CSS"],
  ["shadcnui", "shadcn/ui"],
  ["fastapi", "FastAPI"],
  ["python", "Python"],
  ["langchain", "LangChain"],
  ["langgraph", "LangGraph"],
  ["docling", "Docling"],
  ["chroma", "ChromaDB"],
  ["mongodb", "MongoDB"],
  ["huggingface", "Hugging Face"],
  ["openrouter", "OpenRouter"],
];

function Row() {
  return (
    <ul className="flex shrink-0 items-center gap-4 pr-4">
      {LOGOS.map(([file, name]) => (
        <li
          key={file}
          className="group flex items-center gap-2.5 rounded-full border bg-white/[0.02] py-2 pr-4 pl-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
        >
          <img src={`/logos/${file}.svg`} alt="" width={22} height={22} className="size-[22px] opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0" />
          <span className="text-sm whitespace-nowrap text-muted-foreground transition-colors group-hover:text-foreground">{name}</span>
        </li>
      ))}
    </ul>
  );
}

/** Endless scrolling strip of the real tech logos; pauses on hover. */
export function LogoMarquee() {
  return (
    <section id="stack" className="py-14">
      <p className="mb-8 text-center text-xs tracking-[0.2em] text-muted-foreground uppercase">Built on a modern AI stack</p>
      <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="animate-marquee flex group-hover:[animation-play-state:paused]">
          <Row />
          <Row />
        </div>
      </div>
    </section>
  );
}
