import type { Route } from './+types/docs';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { useLocation } from 'react-router';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import browserCollections from 'collections/browser';
import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { useMDXComponents } from '@/app/components/mdx';
import { GraphProvider } from '@/app/components/campaign-graph';
import { buildGraph } from '@/app/lib/build-graph';
import { getPageImage } from '@/app/lib/og';

export async function loader({ params }: Route.LoaderArgs) {
  const splat = params['*'] ?? '';
  const slugs = splat.split('/').filter((v) => v.length > 0);
  const page = source.getPage(slugs);
  if (!page) throw new Response('Not found', { status: 404 });

  return {
    path: page.path,
    pageTree: await source.serializePageTree(source.getPageTree()),
    graph: slugs.length === 0 ? buildGraph() : null,
    slugs,
    title: page.data.title,
    description: page.data.description,
  };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [];
  const imageUrl = `${import.meta.env.BASE_URL}${getPageImage(data.slugs).url.slice(1)}`;
  return [
    { title: data.title },
    { name: 'description', content: data.description },
    { property: 'og:title', content: data.title },
    { property: 'og:description', content: data.description },
    { property: 'og:image', content: imageUrl },
  ];
}

const VAULT_REPO = 'nicholaswagner/warforthecrown';
const VAULT_BRANCH = 'main';

function vaultEditUrl(source: string): string {
  const encoded = source.split('/').map(encodeURIComponent).join('/');
  return `https://github.com/${VAULT_REPO}/blob/${VAULT_BRANCH}/${encoded}`;
}

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: Mdx }) {
    const source = (frontmatter as { source?: string }).source;
    const { pathname } = useLocation();
    const markdownUrl = `${pathname === '/' ? '/index' : pathname.replace(/\/$/, '')}.md`;
    const githubUrl = source ? vaultEditUrl(source) : undefined;

    return (
      <DocsPage
        toc={toc}
        tableOfContent={githubUrl ? { footer: <EditOnGitHub href={githubUrl} /> } : undefined}
      >
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <div className="flex flex-row gap-2 items-center pt-2 pb-4 not-prose">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={githubUrl} />
        </div>
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
