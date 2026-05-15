import { searchServer } from '@/lib/search-server';

export async function loader() {
  return searchServer.staticGET();
}
