"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import type { GraphNodeType, KnowledgeGraph } from "@/types";

// Canvas library touches `window`, so load it client-side only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const COLORS: Record<GraphNodeType, string> = {
  concept: "#6366f1",
  method: "#0ea5e9",
  model: "#8b5cf6",
  dataset: "#10b981",
  metric: "#f59e0b",
  task: "#ec4899",
};

type GNode = { id: string; label: string; type: GraphNodeType; x?: number; y?: number };
type GLink = { source: string | GNode; target: string | GNode; relation: string };
const idOf = (end: string | GNode) => (typeof end === "string" ? end : end.id);

export function KnowledgeGraphView({ data }: { data: KnowledgeGraph }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(box.current!);
    return () => ro.disconnect();
  }, []);

  // The library mutates node/link objects, so hand it copies.
  const graph = useMemo(
    () => ({ nodes: data.nodes.map((n) => ({ ...n })) as GNode[], links: data.edges.map((e) => ({ ...e })) as GLink[] }),
    [data],
  );
  const neighbours = useMemo(() => {
    if (!hover) return null;
    const set = new Set([hover]);
    for (const l of graph.links) {
      if (idOf(l.source) === hover) set.add(idOf(l.target));
      if (idOf(l.target) === hover) set.add(idOf(l.source));
    }
    return set;
  }, [hover, graph]);

  if (!data.nodes.length) return <p className="text-sm text-muted-foreground">No graph could be generated.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 capitalize">
            <span className="size-2.5 rounded-full" style={{ background: color }} /> {type}
          </span>
        ))}
        <span className="ml-auto">Drag to move · scroll to zoom · hover to focus</span>
      </div>
      <div ref={box} className="overflow-hidden rounded-xl border bg-[radial-gradient(circle,rgb(0_0_0/0.06)_1px,transparent_1px)] bg-[size:16px_16px]">
        {width > 0 && (
          <ForceGraph2D
            graphData={graph}
            width={width}
            height={520}
            cooldownTicks={120}
            linkLabel={(l) => (l as GLink).relation}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkColor={(l) => {
              const link = l as GLink;
              const on = !neighbours || (neighbours.has(idOf(link.source)) && neighbours.has(idOf(link.target)));
              return on ? "rgba(100,116,139,0.55)" : "rgba(100,116,139,0.08)";
            }}
            onNodeHover={(n) => setHover(n ? (n as GNode).id : null)}
            nodeLabel={(n) => `${(n as GNode).label} (${(n as GNode).type})`}
            nodeCanvasObject={(n, ctx, scale) => {
              const node = n as GNode;
              const faded = neighbours && !neighbours.has(node.id);
              ctx.globalAlpha = faded ? 0.15 : 1;
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, 5, 0, 2 * Math.PI);
              ctx.fillStyle = COLORS[node.type] ?? COLORS.concept;
              ctx.fill();
              const size = Math.max(10 / scale, 2.5);
              ctx.font = `${size}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = "#1f2937";
              ctx.fillText(node.label, node.x!, node.y! + 7);
              ctx.globalAlpha = 1;
            }}
            nodePointerAreaPaint={(n, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(n.x!, n.y!, 8, 0, 2 * Math.PI);
              ctx.fill();
            }}
          />
        )}
      </div>
    </div>
  );
}
