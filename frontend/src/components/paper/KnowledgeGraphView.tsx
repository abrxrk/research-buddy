"use client";

import { Maximize2, Minimize2, Minus, Plus, Scan, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { GraphNodeType, KnowledgeGraph } from "@/types";

// Canvas library touches `window`, so load it client-side only (wrapper passes the instance via `graphRef`).
const ForceGraph2D = dynamic(() => import("@/components/paper/ForceGraph"), { ssr: false });

const COLORS: Record<GraphNodeType, string> = {
  concept: "#facc15",
  method: "#38bdf8",
  model: "#a78bfa",
  dataset: "#34d399",
  metric: "#fb923c",
  task: "#f472b6",
};
const TYPES = Object.keys(COLORS) as GraphNodeType[];

type GNode = { id: string; label: string; type: GraphNodeType; degree: number; x?: number; y?: number; vx?: number; vy?: number };
type GLink = { source: string | GNode; target: string | GNode; relation: string };
const idOf = (end: string | GNode) => (typeof end === "string" ? end : end.id);
const radius = (n: GNode) => 4 + Math.sqrt(n.degree) * 2.6;

/** Keeps nodes (plus room for their label) from overlapping. Small graphs, so O(n²) is fine. */
function collide(padding = 14) {
  let nodes: GNode[] = [];
  const force = (alpha: number) => {
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = (b.x ?? 0) - (a.x ?? 0), dy = (b.y ?? 0) - (a.y ?? 0);
        const dist = Math.hypot(dx, dy) || 1;
        const min = radius(a) + radius(b) + padding;
        if (dist < min) {
          const push = ((min - dist) / dist) * alpha * 0.5;
          a.vx = (a.vx ?? 0) - dx * push; a.vy = (a.vy ?? 0) - dy * push;
          b.vx = (b.vx ?? 0) + dx * push; b.vy = (b.vy ?? 0) + dy * push;
        }
      }
  };
  force.initialize = (ns: GNode[]) => (nodes = ns);
  return force;
}

/** Pull towards the centre (stronger for unlinked nodes), so nothing drifts off and shrinks "fit to screen". */
function gravity(strength = 0.05, unlinked = 0.3) {
  let nodes: GNode[] = [];
  const force = (alpha: number) => {
    for (const n of nodes) {
      const k = (n.degree ? strength : unlinked) * alpha;
      n.vx = (n.vx ?? 0) - (n.x ?? 0) * k;
      n.vy = (n.vy ?? 0) - (n.y ?? 0) * k;
    }
  };
  force.initialize = (ns: GNode[]) => (nodes = ns);
  return force;
}

type FG = {
  d3Force: (name: string, fn?: unknown) => { strength?: (n: number) => unknown; distance?: (n: number) => void; distanceMax?: (n: number) => void } | undefined;
  d3ReheatSimulation: () => void;
  zoomToFit: (ms?: number, pad?: number) => void;
  zoom: { (): number; (k: number, ms?: number): void };
  centerAt: (x?: number, y?: number, ms?: number) => void;
};

export function KnowledgeGraphView({ data }: { data: KnowledgeGraph }) {
  const box = useRef<HTMLDivElement>(null);
  const fg = useRef<FG | null>(null);
  const fitted = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<GraphNodeType>>(new Set());
  const [query, setQuery] = useState("");
  const [full, setFull] = useState(false);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(box.current!);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setFull(false), setSelected(null));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The library mutates node/link objects, so hand it copies (recomputed when type filters change).
  const graph = useMemo(() => {
    const degree = new Map<string, number>();
    for (const e of data.edges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    }
    const nodes: GNode[] = data.nodes.filter((n) => !hidden.has(n.type)).map((n) => ({ ...n, degree: degree.get(n.id) ?? 0 }));
    const ids = new Set(nodes.map((n) => n.id));
    const links: GLink[] = data.edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({ ...e }));
    return { nodes, links };
  }, [data, hidden]);

  const byId = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data]);
  const counts = useMemo(() => Object.fromEntries(TYPES.map((t) => [t, data.nodes.filter((n) => n.type === t).length])), [data]);

  const focus = hover ?? selected;
  const neighbours = useMemo(() => {
    if (!focus) return null;
    const set = new Set([focus]);
    for (const l of graph.links) {
      if (idOf(l.source) === focus) set.add(idOf(l.target));
      if (idOf(l.target) === focus) set.add(idOf(l.source));
    }
    return set;
  }, [focus, graph]);
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => (q ? new Set(data.nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id)) : null), [q, data]);

  // Tune forces once the graph instance exists.
  const setRef = useCallback((inst: FG | null) => {
    fg.current = inst;
    if (!inst) return;
    const charge = inst.d3Force("charge");
    charge?.strength?.(-260);
    charge?.distanceMax?.(320); // repulsion only between nearby nodes
    inst.d3Force("link")?.distance?.(70);
    inst.d3Force("collide", collide());
    inst.d3Force("gravity", gravity());
  }, []);

  const relations = useMemo(() => {
    if (!selected) return [];
    return data.edges
      .filter((e) => e.source === selected || e.target === selected)
      .map((e) => (e.source === selected ? { dir: "out", rel: e.relation, other: e.target } : { dir: "in", rel: e.relation, other: e.source }));
  }, [selected, data]);

  function jumpTo(id: string) {
    const n = graph.nodes.find((x) => x.id === id);
    setSelected(id);
    if (n?.x !== undefined) {
      fg.current?.centerAt(n.x, n.y, 600);
      fg.current?.zoom(2.2, 600);
    }
  }

  if (!data.nodes.length) return <p className="text-sm text-muted-foreground">No graph could be generated.</p>;
  const sel = selected ? byId.get(selected) : null;
  const ctrl = "grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground";

  return (
    <div className={cn("flex flex-col gap-3", full && "fixed inset-0 z-50 bg-background/95 p-4 backdrop-blur-xl sm:p-6")}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {TYPES.filter((t) => counts[t]).map((t) => {
          const off = hidden.has(t);
          return (
            <button
              key={t}
              onClick={() => setHidden((h) => { const n = new Set(h); if (off) n.delete(t); else n.add(t); return n; })}
              className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs capitalize transition-all", off ? "opacity-40" : "hover:border-white/25")}
              title={off ? `Show ${t}s` : `Hide ${t}s`}
            >
              <span className="size-2 rounded-full" style={{ background: COLORS[t] }} /> {t}
              <span className="text-muted-foreground tabular-nums">{counts[t]}</span>
            </button>
          );
        })}
        <label className="ml-auto flex h-8 items-center gap-2 rounded-full border bg-white/[0.02] px-3 text-xs focus-within:border-white/25">
          <Search className="size-3.5 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a concept" className="w-28 bg-transparent outline-none placeholder:text-muted-foreground sm:w-36" />
        </label>
      </div>

      {/* canvas */}
      <div ref={box} className={cn("bg-dots relative overflow-hidden rounded-2xl border bg-zinc-950", full ? "flex-1" : "h-[560px]")}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.88_0.17_95/0.06),transparent_60%)]" />
        {size.w > 0 && (
          <ForceGraph2D
            graphRef={setRef as never}
            graphData={graph}
            width={size.w}
            height={size.h}
            backgroundColor="rgba(0,0,0,0)"
            cooldownTicks={160}
            d3VelocityDecay={0.32}
            onEngineStop={() => {
              if (!fitted.current) fg.current?.zoomToFit(500, 60);
              fitted.current = true;
            }}
            linkCurvature={0.12}
            linkWidth={(l) => (neighbours && neighbours.has(idOf((l as GLink).source)) && neighbours.has(idOf((l as GLink).target)) ? 1.6 : 0.8)}
            linkColor={(l) => {
              const link = l as GLink;
              const on = !neighbours || (neighbours.has(idOf(link.source)) && neighbours.has(idOf(link.target)));
              return on ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.04)";
            }}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={(l) => (focus && (idOf((l as GLink).source) === focus || idOf((l as GLink).target) === focus) ? 2 : 0)}
            linkDirectionalParticleWidth={2.2}
            linkDirectionalParticleColor={() => "#facc15"}
            linkLabel={(l) => (l as GLink).relation.replaceAll("_", " ")}
            onNodeHover={(n) => {
              setHover(n ? (n as GNode).id : null);
              if (box.current) box.current.style.cursor = n ? "pointer" : "grab";
            }}
            onNodeClick={(n) => setSelected((n as GNode).id)}
            onBackgroundClick={() => setSelected(null)}
            nodeCanvasObject={(n, ctx, scale) => {
              const node = n as GNode;
              const r = radius(node);
              const color = COLORS[node.type] ?? COLORS.concept;
              const dim = (neighbours && !neighbours.has(node.id)) || (matches && !matches.has(node.id));
              const lit = node.id === focus || matches?.has(node.id);
              ctx.globalAlpha = dim ? 0.12 : 1;
              // glow
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, r * (lit ? 2.6 : 1.9), 0, 2 * Math.PI);
              ctx.fillStyle = color + (lit ? "40" : "1a");
              ctx.fill();
              // core
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
              if (node.id === selected) {
                ctx.lineWidth = 1.5 / scale;
                ctx.strokeStyle = "#fff";
                ctx.stroke();
              }
              // labels: always for hubs and focused neighbourhood, otherwise once zoomed in
              const showLabel = !dim && (node.degree >= 3 || scale > 1.8 || (neighbours?.has(node.id) ?? false) || matches?.has(node.id));
              if (showLabel) {
                const fs = Math.max(11 / scale, 2);
                ctx.font = `500 ${fs}px ui-sans-serif, system-ui, sans-serif`;
                const tw = ctx.measureText(node.label).width;
                const px = 4 / scale, py = 2.5 / scale;
                const y = node.y! + r + 4 / scale;
                ctx.fillStyle = "rgba(9,9,11,0.85)";
                ctx.beginPath();
                ctx.roundRect(node.x! - tw / 2 - px, y, tw + px * 2, fs + py * 2, 4 / scale);
                ctx.fill();
                ctx.fillStyle = lit ? "#fff" : "rgba(228,228,231,0.9)";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(node.label, node.x!, y + py);
              }
              ctx.globalAlpha = 1;
            }}
            nodePointerAreaPaint={(n, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(n.x!, n.y!, radius(n as GNode) + 4, 0, 2 * Math.PI);
              ctx.fill();
            }}
          />
        )}

        {/* zoom controls */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-0.5 rounded-xl border bg-zinc-900/80 p-1 backdrop-blur">
          <button className={ctrl} onClick={() => fg.current?.zoom(fg.current.zoom() * 1.4, 300)} aria-label="Zoom in"><Plus className="size-4" /></button>
          <button className={ctrl} onClick={() => fg.current?.zoom(fg.current.zoom() / 1.4, 300)} aria-label="Zoom out"><Minus className="size-4" /></button>
          <button className={ctrl} onClick={() => fg.current?.zoomToFit(500, 60)} aria-label="Fit to screen"><Scan className="size-4" /></button>
          <button className={ctrl} onClick={() => setFull((f) => !f)} aria-label={full ? "Exit full screen" : "Full screen"}>
            {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
        <p className="pointer-events-none absolute right-3 bottom-3 rounded-full border bg-zinc-900/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
          {graph.nodes.length} nodes · {graph.links.length} links · click a node for details
        </p>

        {/* details panel */}
        {sel && (
          <aside className="animate-pop absolute top-3 right-3 max-h-[calc(100%-4.5rem)] w-72 overflow-y-auto rounded-2xl border bg-zinc-900/90 p-4 shadow-2xl backdrop-blur-xl">
            <div className="mb-3 flex items-start gap-2">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: COLORS[sel.type] }} />
              <div className="flex-1">
                <p className="leading-snug font-medium">{sel.label}</p>
                <p className="text-xs text-muted-foreground capitalize">{sel.type} · {relations.length} connection{relations.length === 1 ? "" : "s"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="size-4" /></button>
            </div>
            <ul className="space-y-1">
              {relations.map((r, i) => {
                const other = byId.get(r.other);
                if (!other) return null;
                return (
                  <li key={i}>
                    <button onClick={() => jumpTo(other.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-white/5">
                      <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {r.dir === "out" ? "→" : "←"} {r.rel.replaceAll("_", " ")}
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: COLORS[other.type] }} />
                      <span className="truncate">{other.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
