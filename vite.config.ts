import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import mdx from 'fumadocs-mdx/vite';
import { globSync } from 'glob';

function contentPages() {
  const files = globSync('**/*.mdx', { cwd: 'content' });
  const paths = new Set<string>();
  for (const file of files) {
    const noExt = file.replace(/\.mdx$/, '');
    const segments = noExt.split('/').filter((s) => s !== 'index');
    const url = segments.length === 0 ? '/docs' : `/docs/${segments.join('/')}`;
    paths.add(url);
  }
  return [...paths].map((path) => ({ path }));
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    mdx(),
    tanstackStart({
      srcDirectory: 'app',
      pages: [
        { path: '/' },
        ...contentPages(),
        { path: '/llms.txt' },
        { path: '/full.txt' },
        { path: '/static.json' },
      ],
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
  ],
});
