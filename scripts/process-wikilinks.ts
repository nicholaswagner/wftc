/**
 * Converts Obsidian wikilinks [[Link]] or [[Link|Display]] to standard Markdown links.
 * For Phase 1, links that don't point to 'writeups' will point to a placeholder.
 */
export function processWikilinks(content: string): string {
  // Regex for [[Link]] or [[Link|Display]], avoiding ![[Link]]
  return content.replace(/(?<!\!)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, link, display) => {
    const text = display || link;
    // For now, everything is a placeholder unless it's handled by process-links.ts
    // This script just handles the syntax conversion.
    return `[${text}](#link-${encodeURIComponent(link)})`;
  });
}
