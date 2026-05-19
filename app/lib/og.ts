export function getPageImage(slugs: string[]) {
  const segments = [...(slugs.length === 0 ? ['index'] : slugs), 'image.webp'];
  return {
    segments,
    url: `/og/${segments.join('/')}`,
  };
}
