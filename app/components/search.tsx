'use client';
import { useMemo } from 'react';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { create } from '@orama/orama';

// Quick-Open-style bonus: walk URL segments and typed tokens in parallel.
// Each in-order segment hit earns 10 points; consecutive hits earn +5.
// Page-level results (no `#fragment`) get a base bonus so the page itself
// outranks its own internal headings on equal token matches. The very last
// URL segment (filename) earns extra, so a token in the filename wins over
// a token deep in a folder name.
function pathScore(url: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const isPage = !url.includes('#');
  const path = url.split('#')[0];
  const segments = path.toLowerCase().split('/').filter(Boolean);
  let ti = 0;
  let score = isPage ? 20 : 0;
  let lastMatchedSegment = -1;
  for (let si = 0; si < segments.length && ti < tokens.length; si++) {
    if (segments[si].includes(tokens[ti])) {
      score += 10;
      if (si === segments.length - 1) score += 10; // filename bonus
      if (lastMatchedSegment === si - 1) score += 5;
      lastMatchedSegment = si;
      ti++;
    }
  }
  return score;
}

async function initOrama() {
  return create({
    schema: { _: 'string' },
    // https://docs.orama.com/docs/orama-js/supported-languages
    language: 'english',
  });
}

export default function DefaultSearchDialog(props: SharedProps) {
  const { search, setSearch, query } = useDocsSearch({
    type: 'static',
    initOrama,
    from: `${import.meta.env.BASE_URL}api/search`,
    // Orama default `limit: 60` truncates the result pool before our
    // path-segment re-ranker sees it, dropping title-only matches like
    // `/reference/people/allister-hound` for queries like "allister" — those
    // get outvoted by long session logs that mention the name 20+ times.
    // 600 covers the whole ~300-page vault with headroom.
    search: { limit: 600 },
  });

  const tokens = useMemo(
    () =>
      search
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 0),
    [search],
  );

  const ranked = useMemo(() => {
    if (query.data === 'empty' || !query.data) return query.data;
    if (tokens.length === 0) return query.data;
    const scored = [...query.data].map((hit, i) => ({
      hit,
      i,
      score: pathScore(hit.url, tokens),
    }));
    // eslint-disable-next-line no-console
    console.log('search debug:', {
      query: search,
      tokens,
      totalHits: query.data.length,
      hits: scored.map(({ hit, i, score }) => ({
        i,
        score,
        type: hit.type,
        url: hit.url,
      })),
    });
    return scored.sort((a, b) => b.score - a.score || a.i - b.i).map(({ hit }) => hit);
  }, [query.data, tokens, search]);

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={ranked !== 'empty' ? ranked : null} />
        {/* Tag filter pills temporarily disabled — they were a footgun
            (sticky filters silently excluding results). Re-enable when we
            have a clearer "active filter" affordance. */}
      </SearchDialogContent>
    </SearchDialog>
  );
}
