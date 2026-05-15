/**
 * Resolves internal links. 
 * For Phase 1, if a link is not within 'writeups', it points to a placeholder.
 */
export function processLinks(content: string, writeupFiles: Set<string>): string {
  // This expects the content to have been processed by processWikilinks already,
  // converting [[Link]] to [Link](#link-Link)
  
  return content.replace(/\[([^\]]+)\]\(#link-([^\)]+)\)/g, (match, text, linkEncoded) => {
    const link = decodeURIComponent(linkEncoded);
    
    // Check if the link exists in our writeupFiles set
    // Obsidian links are often just the filename without extension
    if (writeupFiles.has(link) || writeupFiles.has(`${link}.md`)) {
      // It's an internal writeup link. 
      // We need to figure out the path. For now, let's assume a flat structure in /docs
      // or we can make it more robust in sync.ts
      return `[${text}](/${slugify(link)})`;
    }

    // Otherwise, point to placeholder
    return `[${text}](/placeholder)`;
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]/g, '');
}
