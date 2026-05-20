'use client';
import { createContext, useContext } from 'react';
import { GraphView, type Graph } from './graph-view';

const GraphContext = createContext<Graph | null>(null);

export const GraphProvider = GraphContext.Provider;

export interface CampaignGraphProps {
  compact?: boolean;
  focalId?: string;
}

export function CampaignGraph({ compact = false, focalId }: CampaignGraphProps = {}) {
  const graph = useContext(GraphContext);
  if (!graph || graph.nodes.length === 0) return null;
  return (
    <div className={compact ? 'h-[280px]' : 'h-[600px]'}>
      <GraphView graph={graph} focalId={focalId} compact={compact} />
    </div>
  );
}
