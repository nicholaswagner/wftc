import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

const SECTION_TAGS = new Set(['narrative', 'reference']);

function tagFor(url: string): string | undefined {
  const segment = url.split('/').filter(Boolean)[0];
  return segment && SECTION_TAGS.has(segment) ? segment : undefined;
}

export const searchServer = createFromSource(source, {
  language: 'english',
  async buildIndex(page) {
    const raw = page.data.structuredData as unknown;
    const structuredData =
      typeof raw === 'function' ? await (raw as () => Promise<unknown>)() : raw;

    const tag = tagFor(page.url);

    return {
      id: page.url,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData: structuredData as never,
      ...(tag ? { tag } : {}),
    };
  },
});
