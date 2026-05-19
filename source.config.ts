import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import remarkGfm from 'remark-gfm';

export const docs = defineDocs({
  dir: 'content',
  docs: {
    schema: pageSchema.extend({
      source: z.string().optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
      extractLinkReferences: true,
    },
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
});
