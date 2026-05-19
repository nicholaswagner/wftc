import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { ComponentProps } from 'react';
import type { MDXComponents } from 'mdx/types';
import { CampaignGraph } from './campaign-graph';

function Img({ src, ...props }: ComponentProps<'img'>) {
  // remarkImage emits absolute `/vault/foo.png` paths as JS imports against
  // the on-disk `public/vault/foo.png`, which Vite serves at `/public/...`
  // — the wrong URL. Strip the leaked prefix so the image resolves against
  // the actual public-asset URL.
  const fixed = typeof src === 'string' ? src.replace(/^\/public\//, '/') : src;
  return <img src={fixed} {...props} />;
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    img: Img,
    CampaignGraph,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
