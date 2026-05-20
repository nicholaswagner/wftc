'use client';
import { lazy, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ForceGraphMethods,
  ForceGraphProps,
  LinkObject,
  NodeObject,
} from 'react-force-graph-2d';
import { forceCollide, forceLink, forceManyBody } from 'd3-force';
import { useRouter } from 'fumadocs-core/framework';

export interface Graph {
  links: Link[];
  nodes: Node[];
}

export type Node = NodeObject<NodeType>;
export type Link = LinkObject<NodeType, LinkType>;

export interface NodeType {
  text: string;
  description?: string;
  neighbors?: string[];
  url: string;
}

export type LinkType = Record<string, unknown>;

export interface GraphViewProps {
  graph: Graph;
  focalId?: string;
  compact?: boolean;
}

const ForceGraph2D = lazy(
  () => import('react-force-graph-2d'),
) as typeof import('react-force-graph-2d').default;

export function GraphView(props: GraphViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  useEffect(() => {
    setMount(true);
  }, []);

  return (
    <div
      ref={ref}
      className="relative border size-full [&_canvas]:size-full rounded-xl overflow-hidden bg-fd-background"
    >
      {mount && <ClientOnly {...props} containerRef={ref} />}
    </div>
  );
}

function ClientOnly({
  containerRef,
  graph,
  focalId,
}: GraphViewProps & { containerRef: RefObject<HTMLDivElement | null> }) {
  const [fg, setFg] = useState<ForceGraphMethods<Node, Link> | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const hoveredRef = useRef<Node | null>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    flipX: boolean;
    flipY: boolean;
    content: string;
  } | null>(null);

  const attachRef = useCallback(
    (instance: ForceGraphMethods<Node, Link> | undefined) => setFg(instance ?? null),
    [],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  useEffect(() => {
    if (!fg) return;
    graphRef.current = fg;
    fg.d3Force('link', forceLink().distance(200));
    fg.d3Force('charge', forceManyBody().strength(10));
    fg.d3Force('collision', forceCollide(60));

    const padding = Math.min(size.width, size.height) * 0.1;
    const initialFit = setTimeout(() => fg.zoomToFit(300, padding), 400);
    return () => clearTimeout(initialFit);
  }, [fg, graph, size]);

  const handleNodeHover = (node: Node | null) => {
    const graph = graphRef.current;
    if (!graph) return;
    hoveredRef.current = node;

    if (node) {
      const coords = graph.graph2ScreenCoords(node.x!, node.y!);
      const flipX = coords.x > size.width / 2;
      const flipY = coords.y > size.height / 2;
      setTooltip({
        x: coords.x + (flipX ? -8 : 8),
        y: coords.y + (flipY ? -8 : 8),
        flipX,
        flipY,
        content: node.text,
      });
    } else {
      setTooltip(null);
    }
  };

  const nodeRadius = (node: Node) => 4 + Math.sqrt(node.neighbors?.length ?? 0) * 2;

  const nodePointerAreaPaint: ForceGraphProps['nodePointerAreaPaint'] = (node, color, ctx) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, nodeRadius(node), 0, 2 * Math.PI, false);
    ctx.fill();
  };

  const nodeCanvasObject: ForceGraphProps['nodeCanvasObject'] = (node, ctx) => {
    const container = containerRef.current;
    if (!container) return;
    const radius = nodeRadius(node);
    const isFocal = focalId !== undefined && node.id === focalId;
    const isHovered = hoveredRef.current?.id === node.id;
    const style = getComputedStyle(container);

    ctx.beginPath();
    ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = isFocal
      ? '#14b8a6'
      : isHovered
        ? '#0f766e'
        : `color-mix(in oklab, ${style.getPropertyValue('--color-fd-muted-foreground')} 45%, transparent)`;
    ctx.fill();
  };

  const linkColor = (link: Link) => {
    const container = containerRef.current;
    if (!container) return '#999';
    const hoverNode = hoveredRef.current;
    if (
      hoverNode &&
      typeof link.source === 'object' &&
      typeof link.target === 'object' &&
      (hoverNode.id === link.source.id || hoverNode.id === link.target.id)
    ) {
      return '#134e4a';
    }
    const style = getComputedStyle(container);
    return `color-mix(in oklab, ${style.getPropertyValue('--color-fd-muted-foreground')} 25%, transparent)`;
  };

  // Enrich nodes with neighbors for hover effects
  const enrichedNodes = useMemo(() => {
    const { nodes, links } = structuredClone(graph);
    for (const node of nodes) {
      node.neighbors = links.flatMap((link) => {
        if (link.source === node.id) return link.target as string;
        if (link.target === node.id) return link.source as string;
        return [];
      });
    }

    return {
      nodes,
      links,
    };
  }, [graph]);

  if (size.width === 0 || size.height === 0) return null;

  return (
    <>
      <ForceGraph2D<NodeType, LinkType>
        ref={attachRef}
        width={size.width}
        height={size.height}
        graphData={enrichedNodes}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={linkColor}
        onNodeHover={handleNodeHover}
        onNodeClick={(node) => {
          router.push(node.url);
        }}
        warmupTicks={60}
        onEngineStop={() => fg?.zoomToFit(300, Math.min(size.width, size.height) * 0.1)}
        linkWidth={1}
        enableNodeDrag
        enableZoomInteraction
      />
      {tooltip && (
        <div
          className="absolute bg-fd-popover text-fd-popover-foreground size-fit p-2 border rounded-xl shadow-lg text-sm max-w-xs pointer-events-none"
          style={{
            top: tooltip.y,
            left: tooltip.x,
            transform: `translate(${tooltip.flipX ? '-100%' : '0'}, ${tooltip.flipY ? '-100%' : '0'})`,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </>
  );
}
