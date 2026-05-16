import { copyFileSync, existsSync, readdirSync, renameSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE_PATH = process.env.BASE_PATH ?? '/';
const CLIENT_DIR = 'build/client';
const trimmed = BASE_PATH.replace(/^\/+|\/+$/g, '');

if (trimmed) {
  const nested = join(CLIENT_DIR, trimmed);
  if (!existsSync(nested)) {
    console.warn(`flatten-basepath: ${nested} does not exist; skipping flatten.`);
  } else {
    console.log(`flatten-basepath: moving ${nested}/* into ${CLIENT_DIR}/`);
    for (const entry of readdirSync(nested)) {
      const from = join(nested, entry);
      const to = join(CLIENT_DIR, entry);
      if (existsSync(to)) {
        throw new Error(`flatten-basepath: ${to} already exists; refusing to overwrite.`);
      }
      renameSync(from, to);
    }
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
