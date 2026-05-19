import { ImageResponse } from '@takumi-rs/image-response';
import { generate as DefaultImage } from 'fumadocs-ui/og/takumi';
import { glob } from 'glob';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { getPageImage } from '../app/lib/og';

const SITE_NAME = 'War for the Crown';
const CONTENT_DIR = 'content';
const OUT_DIR = 'public/og';

function readFrontmatter(file: string): { title?: string; description?: string } {
  const raw = readFileSync(file, 'utf-8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out: { title?: string; description?: string } = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(title|description):\s*"?(.*?)"?\s*$/);
    if (m) out[m[1] as 'title' | 'description'] = m[2];
  }
  return out;
}

console.log('🖼  Generating OG images...');

const files = await glob('**/*.mdx', { cwd: CONTENT_DIR });
let count = 0;

for (const file of files) {
  const { title = 'War for the Crown', description } = readFrontmatter(join(CONTENT_DIR, file));
  const slugs = file
    .replace(/\.mdx$/, '')
    .split('/')
    .filter((s) => s !== 'index');

  const response = new ImageResponse(
    <DefaultImage title={title} description={description} site={SITE_NAME} />,
    { width: 1200, height: 630, format: 'webp' },
  );
  const buffer = Buffer.from(await response.arrayBuffer());
  const outPath = join(OUT_DIR, ...getPageImage(slugs).segments);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buffer);
  count++;
}

console.log(`✅ Wrote ${count} OG images to ${OUT_DIR}/`);
