import { source } from '@/lib/source';
import { getLLMText } from '@/lib/get-llm-text';

export async function loader() {
  const scanned = await Promise.all(source.getPages().map(getLLMText));
  return new Response(scanned.join('\n\n'));
}
