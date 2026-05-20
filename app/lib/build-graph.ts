import { source } from '@/lib/source';
import type { Graph } from '../components/graph-view';

export function buildNeighborhoodGraph(focalUrl: string): Graph {
  const pages = source.getPages();
  const focal = pages.find((p) => p.url === focalUrl);
  if (!focal) return { nodes: [], links: [] };

  const neighborUrls = new Set<string>();

  for (const ref of focal.data.extractedReferences ?? []) {
    const target = source.getPageByHref(ref.href);
    if (target) neighborUrls.add(target.page.url);
  }

  for (const p of pages) {
    if (p.url === focalUrl) continue;
    for (const ref of p.data.extractedReferences ?? []) {
      const target = source.getPageByHref(ref.href);
      if (target?.page.url === focalUrl) {
        neighborUrls.add(p.url);
        break;
      }
    }
  }

  const included = new Set([focalUrl, ...neighborUrls]);
  const nodes: Graph['nodes'] = [];
  const links: Graph['links'] = [];

  for (const p of pages) {
    if (!included.has(p.url)) continue;
    nodes.push({
      id: p.url,
      url: p.url,
      text: p.data.title,
      description: p.data.description,
    });
  }
  for (const p of pages) {
    if (!included.has(p.url)) continue;
    for (const ref of p.data.extractedReferences ?? []) {
      const target = source.getPageByHref(ref.href);
      if (!target || !included.has(target.page.url)) continue;
      // Only keep edges that touch the focal — hides cross-neighbor links
      // like `Caritas → some session log` from the hub-and-spoke view.
      if (p.url !== focalUrl && target.page.url !== focalUrl) continue;
      links.push({ source: p.url, target: target.page.url });
    }
  }
  return { nodes, links };
}

export function buildGraph(): Graph {
  const pages = source.getPages();
  const graph: Graph = { links: [], nodes: [] };

  for (const page of pages) {
    graph.nodes.push({
      id: page.url,
      url: page.url,
      text: page.data.title,
      description: page.data.description,
    });

    const { extractedReferences = [] } = page.data;
    for (const ref of extractedReferences) {
      const refPage = source.getPageByHref(ref.href);
      if (!refPage) continue;

      graph.links.push({
        source: page.url,
        target: refPage.page.url,
      });
    }
  }

  return graph;
}
