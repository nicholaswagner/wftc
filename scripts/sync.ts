import { glob } from 'glob';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { processWikilinks } from './process-wikilinks';
import { processImages } from './process-images';
import { processLinks } from './process-links';

const SOURCE_DIR = 'submodules/warforthecrown/writeups';
const TARGET_DIR = 'content';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugifyPath(relPath: string): string {
  const ext = extname(relPath);
  const noExt = relPath.slice(0, relPath.length - ext.length);
  return noExt.split('/').map(slugify).join('/') + ext;
}

async function sync() {
  console.log('🚀 Starting content sync...');

  // 1. Clean target directory
  if (existsSync(TARGET_DIR)) {
    rmSync(TARGET_DIR, { recursive: true, force: true });
  }
  mkdirSync(TARGET_DIR);

  // 2. Find all markdown files in writeups
  const files = await glob('**/*.md', { cwd: SOURCE_DIR });
  const writeupFileNames = new Set(files.map(f => basename(f, '.md')));

  console.log(`Found ${files.length} writeup files.`);

  // 3. Process each file
  for (const file of files) {
    const sourcePath = join(SOURCE_DIR, file);
    const slugged = slugifyPath(file).replace(/\.md$/, '.mdx');
    const targetPath = join(TARGET_DIR, slugged);
    
    mkdirSync(dirname(targetPath), { recursive: true });

    let content = readFileSync(sourcePath, 'utf-8');

    // Fix unclosed <br> tags for MDX compatibility
    content = content.replace(/<br>/g, '<br/>');

    // Generate frontmatter
    const title = basename(file, '.md');
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "Campaign notes for ${title}"
---

`;

    // Modular processing
    content = processImages(content);
    content = processWikilinks(content);
    content = processLinks(content, writeupFileNames);

    writeFileSync(targetPath, frontmatter + content);
  }

  // 4. Create placeholder page
  const placeholderPath = join(TARGET_DIR, 'placeholder.mdx');
  const placeholderContent = `---
title: "Work in Progress"
description: "This content is not yet integrated."
---

# Work in Progress

The link you followed points to a part of the vault that has not been integrated into this documentation site yet. 

Stay tuned for future updates!
`;
  writeFileSync(placeholderPath, placeholderContent);

  // 5. Create index if it doesn't exist
  const indexPath = join(TARGET_DIR, 'index.mdx');
  if (!existsSync(indexPath)) {
    const indexContent = `---
title: "Campaign Writeups"
description: "Weekly session notes for War for the Crown."
---

# Campaign Writeups

Welcome to the campaign notes for our War for the Crown Pathfinder 2e game.

Use the sidebar to navigate through the different acts and sessions.
`;
    writeFileSync(indexPath, indexContent);
  }

  console.log('✅ Content sync complete!');
}

sync().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
