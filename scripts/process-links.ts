/**
 * Resolves wikilink placeholders left behind by processWikilinks.
 *
 * processWikilinks turns `[[Link]]` into `[Link](#link-Link)`.
 * This pass turns the `#link-...` anchors into real internal URLs by
 * looking up the link target's basename in `linkIndex`. Unknown targets
 * fall through to /placeholder.
 */
export function processLinks(content: string, linkIndex: Map<string, string>): string {
  return content.replace(/\[([^\]]+)\]\(#link-([^\)]+)\)/g, (_match, text, encoded) => {
    const link = decodeURIComponent(encoded);
    const url = linkIndex.get(link) ?? linkIndex.get(`${link}.md`);
    return `[${text}](${url ?? '/placeholder'})`;
  });
}
