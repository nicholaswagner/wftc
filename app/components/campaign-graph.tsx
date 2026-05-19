'use client';
import { createContext, useContext } from 'react';
import { GraphView, type Graph } from './graph-view';

const GraphContext = createContext<Graph | null>(null);

export const GraphProvider = GraphContext.Provider;

export function CampaignGraph() {
  const graph = useContext(GraphContext);
  if (!graph) return null;
  return <GraphView graph={graph} />;
}
