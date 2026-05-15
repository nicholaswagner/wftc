import { existsSync, readdirSync, renameSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE_PATH = process.env.BASE_PATH ?? '/';
const CLIENT_DIR = 'build/client';
const trimmed = BASE_PATH.replace(/^\/+|\/+$/g, '');

if (!trimmed) {
  console.log('flatten-basepath: BASE_PATH is "/", nothing to flatten.');
  process.exit(0);
}

const nested = join(CLIENT_DIR, trimmed);
if (!existsSync(nested)) {
  console.warn(`flatten-basepath: ${nested} does not exist; skipping.`);
  process.exit(0);
}

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
console.log('flatten-basepath: done.');
