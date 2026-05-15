import { createFileRoute } from '@tanstack/react-router';
import { searchServer } from '@/lib/search-server';

export const Route = createFileRoute('/static.json')({
  server: {
    handlers: {
      GET: async () => searchServer.staticGET(),
    },
  },
});
