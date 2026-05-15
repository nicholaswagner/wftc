import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { Suspense } from 'react';
import browserCollections from 'collections/browser';
import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { useMDXComponents } from '@/app/components/mdx';

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? [];
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    await clientLoader.preload(page.path);

    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  },
});

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout {...baseOptions()} tree={data.pageTree}>
      <Suspense>{clientLoader.useContent(data.path)}</Suspense>
    </DocsLayout>
  );
}
