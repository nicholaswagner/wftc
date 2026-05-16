import { glob } from 'glob';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { processWikilinks } from './process-wikilinks';
import { processImages } from './process-images';
import { processLinks } from './process-links';

const VAULT_DIR = 'submodules/warforthecrown';
const TARGET_DIR = 'content';
const README_FILE = 'README.md';

// Page slugs to omit from the sidebar (still reachable by URL).
// Names match the file/folder slug under content/ (no extension).
const SIDEBAR_HIDDEN = new Set(['placeholder']);

// Folder slugs (relative to content/) that should be expanded by default.
const SIDEBAR_DEFAULT_OPEN = new Set(['narrative', 'reference']);

// Images referenced from React components (not from markdown wikilinks).
// These get copied unconditionally so they're available at /vault/<name>.
const SYSTEM_IMAGES = ['404.png'];
const VAULT_IMAGE_DIR = 'submodules/warforthecrown/images';
const PUBLIC_VAULT_DIR = 'public/vault';

// Top-level vault folders that get synced into content/.
// Each entry maps a vault folder to its slugified target prefix.
const SOURCE_ROOTS: { vault: string; targetPrefix: string }[] = [
  { vault: 'Narrative', targetPrefix: 'narrative' },
  { vault: 'Reference', targetPrefix: 'reference' },
];

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

function escapeYaml(value: string): string {
  return value.replace(/"/g, '\\"');
}

/**
 * Escape characters that MDX would otherwise interpret as JSX/expression syntax,
 * leaving fenced code blocks and inline code spans untouched.
 *
 * - `<` not followed by a letter, `!`, `/`, or `>` -> `&lt;` (handles `<--`, `<-` etc.).
 * - Bare `{` and `}` -> `\{`, `\}` (Obsidian sometimes uses `{prose}` annotations).
 */
function sanitizeMdx(content: string): string {
  const fenced = content.split(/(```[\s\S]*?```)/g);
  return fenced
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part
        .split(/(`[^`\n]*`)/g)
        .map((seg, j) => {
          if (j % 2 === 1) return seg;
          return seg
            .replace(/<(?![a-zA-Z!/>])/g, '&lt;')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}');
        })
        .join('');
    })
    .join('');
}

async function sync() {
  console.log('🚀 Starting content sync...');

  if (existsSync(TARGET_DIR)) {
    rmSync(TARGET_DIR, { recursive: true, force: true });
  }
  mkdirSync(TARGET_DIR, { recursive: true });

  // Pass 1 — discover all markdown files across every source root and build
  // a basename → URL index for wikilink resolution.
  type Entry = {
    sourcePath: string; // absolute-ish path under the vault
    relPath: string; // path relative to vault (e.g. "Narrative/Act 1 - Crownfall/foo.md")
    targetRel: string; // slugified path relative to content/ (e.g. "narrative/act-1-crownfall/foo.mdx")
    urlPath: string; // public URL (e.g. "/narrative/act-1-crownfall/foo")
  };
  const entries: Entry[] = [];
  const linkIndex = new Map<string, string>();

  for (const { vault, targetPrefix } of SOURCE_ROOTS) {
    const root = join(VAULT_DIR, vault);
    if (!existsSync(root)) {
      console.warn(`Source root missing: ${root} (skipping)`);
      continue;
    }
    const files = await glob('**/*.md', { cwd: root });
    for (const file of files) {
      const slugged = slugifyPath(file).replace(/\.md$/, '.mdx');
      const targetRel = `${targetPrefix}/${slugged}`;
      const urlPath = '/' + targetRel.replace(/\.mdx$/, '');
      const entry: Entry = {
        sourcePath: join(root, file),
        relPath: `${vault}/${file}`,
        targetRel,
        urlPath,
      };
      entries.push(entry);

      const name = basename(file, '.md');
      // First write wins on basename collisions; warn if we see a duplicate.
      if (linkIndex.has(name)) {
        console.warn(
          `Wikilink basename collision: "${name}" — keeping ${linkIndex.get(name)}, ignoring ${urlPath}`,
        );
      } else {
        linkIndex.set(name, urlPath);
      }
    }
  }
  console.log(`Found ${entries.length} markdown files across vault.`);

  // Pass 2 — write each file to content/, processed.
  const dirsTouched = new Set<string>();
  for (const entry of entries) {
    const targetPath = join(TARGET_DIR, entry.targetRel);
    mkdirSync(dirname(targetPath), { recursive: true });

    let content = readFileSync(entry.sourcePath, 'utf-8');
    content = content.replace(/<br>/g, '<br/>');
    content = sanitizeMdx(content);

    const title = basename(entry.relPath, '.md');
    const description = `Campaign notes for ${title}`;
    const frontmatter = `---\ntitle: "${escapeYaml(title)}"\ndescription: "${escapeYaml(description)}"\n---\n\n`;

    content = processImages(content);
    content = processWikilinks(content);
    content = processLinks(content, linkIndex);

    writeFileSync(targetPath, frontmatter + content);

    // Remember every directory that was created so we can write meta.json later.
    let dir = dirname(entry.targetRel);
    while (dir && dir !== '.') {
      dirsTouched.add(dir);
      dir = dirname(dir);
    }
  }

  // Pass 3 — write meta.json into every synced directory using the original
  // (un-slugged) folder name as the display title.
  // Build a mapping from slugged dir → original dir name by walking entries.
  const dirTitle = new Map<string, string>();
  for (const entry of entries) {
    const sluggedSegments = entry.targetRel.split('/').slice(0, -1); // drop filename
    const originalSegments = entry.relPath.split('/').slice(0, -1);
    // First segment of slugged is targetPrefix, original is vault folder name.
    for (let i = 0; i < sluggedSegments.length; i++) {
      const sluggedDir = sluggedSegments.slice(0, i + 1).join('/');
      const originalName = originalSegments[i];
      // First write wins (preserve the first encountered casing).
      if (!dirTitle.has(sluggedDir)) dirTitle.set(sluggedDir, originalName);
    }
  }
  for (const dir of dirsTouched) {
    const title = dirTitle.get(dir) ?? basename(dir);
    const meta: Record<string, unknown> = { title };
    if (SIDEBAR_DEFAULT_OPEN.has(dir)) meta.defaultOpen = true;
    const metaPath = join(TARGET_DIR, dir, 'meta.json');
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  }

  // Landing page: copy the vault README, run it through the same processors,
  // and wrap with frontmatter. Goes to content/index.mdx.
  const readmeSource = join(VAULT_DIR, README_FILE);
  if (existsSync(readmeSource)) {
    let readme = readFileSync(readmeSource, 'utf-8');
    readme = readme.replace(/<br>/g, '<br/>');
    readme = processImages(readme);
    readme = processWikilinks(readme);
    readme = processLinks(readme, linkIndex);
    const indexFrontmatter = `---\ntitle: "War for the Crown"\ndescription: "Campaign notes, session logs, and reference material for our weekly Pathfinder 2e game."\n---\n\n`;
    writeFileSync(join(TARGET_DIR, 'index.mdx'), indexFrontmatter + readme);
  } else {
    throw new Error(
      `Vault README not found at ${readmeSource}. Landing page would be empty. Check case-sensitive filename.`,
    );
  }

  // System images — copy unconditionally so React components can reference them.
  for (const name of SYSTEM_IMAGES) {
    const src = join(VAULT_IMAGE_DIR, name);
    if (!existsSync(src)) {
      console.warn(`System image missing: ${src}`);
      continue;
    }
    if (!existsSync(PUBLIC_VAULT_DIR)) mkdirSync(PUBLIC_VAULT_DIR, { recursive: true });
    copyFileSync(src, join(PUBLIC_VAULT_DIR, name));
  }

  // Placeholder page for unresolved wikilinks.
  const placeholderContent = `---\ntitle: "Work in Progress"\ndescription: "This content is not yet integrated."\n---\n\n# Work in Progress\n\nThe link you followed points to a part of the vault that has not been integrated into this documentation site yet.\n\nStay tuned for future updates!\n`;
  writeFileSync(join(TARGET_DIR, 'placeholder.mdx'), placeholderContent);

  // Root meta.json — controls top-level sidebar order/visibility.
  // We list every top-level item except those in SIDEBAR_HIDDEN.
  const topLevel = new Set<string>();
  for (const entry of entries) {
    topLevel.add(entry.targetRel.split('/')[0]); // top-level dir
  }
  // Loose .mdx files at content root (e.g. placeholder.mdx) — opt-in via the
  // SIDEBAR_HIDDEN check below.
  for (const name of ['placeholder']) topLevel.add(name);
  const visiblePages = [...topLevel]
    .filter((name) => !SIDEBAR_HIDDEN.has(name))
    .sort();
  writeFileSync(
    join(TARGET_DIR, 'meta.json'),
    JSON.stringify({ pages: visiblePages }, null, 2) + '\n',
  );

  console.log('✅ Content sync complete!');
}

sync().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
