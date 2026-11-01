"use client";

import ForceGraph2D from "react-force-graph-2d";

/**
 * next/dynamic doesn't forward refs, so the graph instance is passed through a normal prop.
 * Loaded with dynamic(..., { ssr: false }) because the canvas library touches `window`.
 */
export default function ForceGraph({ graphRef, ...props }: React.ComponentProps<typeof ForceGraph2D> & { graphRef: React.Ref<never> }) {
  return <ForceGraph2D ref={graphRef as never} {...props} />;
}
