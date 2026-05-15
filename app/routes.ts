import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  route('llms.txt', 'routes/llms.ts'),
  route('full.txt', 'routes/full.ts'),
  route('api/search', 'routes/search.ts'),
  index('routes/docs.tsx', { id: 'home' }),
  route('*', 'routes/docs.tsx', { id: 'content' }),
] satisfies RouteConfig;
