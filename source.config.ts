import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import remarkGfm from 'remark-gfm';

export const docs = defineDocs({
  dir: 'content',
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
});
