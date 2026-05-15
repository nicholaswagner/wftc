import type { Config } from '@react-router/dev/config';
import { globSync } from 'glob';

const BASE_PATH = process.env.BASE_PATH ?? '/';

function contentPaths(): string[] {
  const files = globSync('**/*.mdx', { cwd: 'content' });
  const out = new Set<string>(['/']);
  for (const f of files) {
    const segs = f.replace(/\.mdx$/, '').split('/').filter((s) => s !== 'index');
    out.add(segs.length === 0 ? '/' : `/${segs.join('/')}`);
  }
  return [...out];
}

export default {
  ssr: false,
  basename: BASE_PATH,
  prerender: async () => [
    ...contentPaths(),
    '/llms.txt',
    '/full.txt',
    '/api/search',
  ],
} satisfies Config;
