import { copyFileSync, existsSync, readdirSync, renameSync, rmdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE_PATH = process.env.BASE_PATH ?? '/';
const CLIENT_DIR = 'build/client';
const trimmed = BASE_PATH.replace(/^\/+|\/+$/g, '');

// Recursively move every file/dir from `from` into `to`. If a directory exists
// on both sides, descend and merge. If a file exists on both sides, refuse
// (signals a real collision between prerendered routes and public/ assets).
function mergeMove(from: string, to: string) {
  for (const entry of readdirSync(from)) {
    const fromEntry = join(from, entry);
    const toEntry = join(to, entry);
    const fromIsDir = statSync(fromEntry).isDirectory();
    if (!existsSync(toEntry)) {
      renameSync(fromEntry, toEntry);
      continue;
    }
    const toIsDir = statSync(toEntry).isDirectory();
    if (fromIsDir && toIsDir) {
      mergeMove(fromEntry, toEntry);
      rmdirSync(fromEntry);
      continue;
    }
    throw new Error(`flatten-basepath: ${toEntry} already exists; refusing to overwrite.`);
  }
}

if (trimmed) {
  const nested = join(CLIENT_DIR, trimmed);
  if (!existsSync(nested)) {
    console.warn(`flatten-basepath: ${nested} does not exist; skipping flatten.`);
  } else {
    console.log(`flatten-basepath: merging ${nested}/* into ${CLIENT_DIR}/`);
    mergeMove(nested, CLIENT_DIR);
    rmdirSync(nested);
  }
} else {
  console.log('flatten-basepath: BASE_PATH is "/", skipping flatten.');
}

// GitHub Pages serves /404.html on any unknown URL. Use the SPA fallback so
// the router boots there and renders our root ErrorBoundary.
const shell = join(CLIENT_DIR, '__spa-fallback.html');
const notFound = join(CLIENT_DIR, '404.html');
if (existsSync(shell)) {
  copyFileSync(shell, notFound);
  console.log(`flatten-basepath: wrote ${notFound} (copy of __spa-fallback.html)`);
} else {
  console.warn('flatten-basepath: __spa-fallback.html missing; cannot write 404.html');
}

console.log('flatten-basepath: done.');
