import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('docs/*', 'routes/docs.tsx'),
  route('llms.txt', 'routes/llms.ts'),
  route('full.txt', 'routes/full.ts'),
  route('api/search', 'routes/search.ts'),
] satisfies RouteConfig;
