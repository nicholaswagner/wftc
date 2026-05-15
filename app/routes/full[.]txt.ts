import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { getLLMText } from '@/lib/get-llm-text';

export const Route = createFileRoute('/full.txt')({
  server: {
    handlers: {
      GET: async () => {
        const scanned = await Promise.all(source.getPages().map(getLLMText));
        return new Response(scanned.join('\n\n'));
      },
    },
  },
});
