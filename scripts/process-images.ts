import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const VAULT_IMAGE_DIR = 'submodules/warforthecrown/images';
const PUBLIC_IMAGE_DIR = 'public/vault';

/**
 * Converts Obsidian image links ![[image.png]] to standard Markdown images.
 * Copies the images from the vault to the public directory.
 */
export function processImages(content: string): string {
  if (!existsSync(PUBLIC_IMAGE_DIR)) {
    mkdirSync(PUBLIC_IMAGE_DIR, { recursive: true });
  }

  // Regex for ![[image.png]] or ![[image.png|width]]
  return content.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, imageName, size) => {
    const filename = imageName.trim();
    const sourcePath = join(VAULT_IMAGE_DIR, filename);
    
    // Also check in assets subfolder if it exists
    const sourcePathAssets = join(VAULT_IMAGE_DIR, 'assets', filename);

    let found = false;
    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, join(PUBLIC_IMAGE_DIR, filename));
      found = true;
    } else if (existsSync(sourcePathAssets)) {
      copyFileSync(sourcePathAssets, join(PUBLIC_IMAGE_DIR, filename));
      found = true;
    }

    if (found) {
      // URL-encode the filename so spaces / special characters survive the
      // markdown parser and the eventual HTTP request.
      return `![${filename}](/vault/${encodeURI(filename)})`;
    }

    return `*Image not found: ${filename}*`;
  });
}
