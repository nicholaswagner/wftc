import type { Route } from './+types/docs';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import browserCollections from 'collections/browser';
import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { useMDXComponents } from '@/app/components/mdx';
import { GraphProvider } from '@/app/components/campaign-graph';
import { buildGraph } from '@/app/lib/build-graph';

export async function loader({ params }: Route.LoaderArgs) {
  const splat = params['*'] ?? '';
  const slugs = splat.split('/').filter((v) => v.length > 0);
  const page = source.getPage(slugs);
  if (!page) throw new Response('Not found', { status: 404 });

  return {
    path: page.path,
    pageTree: await source.serializePageTree(source.getPageTree()),
    graph: slugs.length === 0 ? buildGraph() : null,
  };
}

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: Mdx }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <Mdx components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

export default function Page({ loaderData }: Route.ComponentProps) {
  if (!loaderData) {
    throw new Response('Not found', { status: 404 });
  }
  const { path, pageTree } = useFumadocsLoader(loaderData);

  return (
    <GraphProvider value={loaderData.graph}>
      <DocsLayout {...baseOptions()} tree={pageTree}>
        {clientLoader.useContent(path)}
      </DocsLayout>
    </GraphProvider>
  );
}
