import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import mdx from 'fumadocs-mdx/vite';

const BASE_PATH = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [tailwindcss(), tsconfigPaths(), mdx(), reactRouter()],
});
