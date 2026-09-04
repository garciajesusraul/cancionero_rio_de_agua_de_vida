// api.bible wrapper - solo LBLA (default) y NTV permitidas
// La key se lee de VITE_BIBLE_API_KEY (dev) y a futuro se moverá a Supabase Edge Function / Vault
// para no exponerla en el bundle.

export const ALLOWED_BIBLES = [
  { id: 'e3f420b9665abaeb-01', abbreviation: 'LBLA', name: 'La Biblia de las Américas' },
  { id: '826f63861180e056-01', abbreviation: 'NTV', name: 'Nueva Traducción Viviente' },
] as const;

export const DEFAULT_BIBLE_ID = 'e3f420b9665abaeb-01'; // LBLA

const BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_BIBLE_API_URL || 'https://rest.api.bible';
const API_KEY = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_BIBLE_API_KEY || 'HZBuuMN8r9F0Jbmblwmrd';

function headers() {
  return { 'api-key': API_KEY } as Record<string, string>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`api.bible ${res.status}: ${text.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

export async function getBooks(bibleId: string) {
  // GET /v1/bibles/{bibleId}/books
  const data = await fetchJson<{ data: Array<{ id: string; bibleId: string; abbreviation: string; name: string; nameLong: string }> }>(
    `${BASE_URL}/v1/bibles/${bibleId}/books`
  );
  return data.data;
}

export async function getChapters(bibleId: string, bookId: string) {
  // GET /v1/bibles/{bibleId}/books/{bookId}/chapters
  const data = await fetchJson<{ data: Array<{ id: string; bibleId: string; bookId: string; number: string; reference: string }> }>(
    `${BASE_URL}/v1/bibles/${bibleId}/books/${bookId}/chapters`
  );
  return data.data;
}

export async function getChapterContent(bibleId: string, chapterId: string) {
  // GET /v1/bibles/{bibleId}/chapters/{chapterId}?content-type=html&include-notes=false&include-titles=true
  const data = await fetchJson<{ data: { id: string; bibleId: string; bookId: string; number: string; reference: string; content: string; verseCount: number; copyright: string } }>(
    `${BASE_URL}/v1/bibles/${bibleId}/chapters/${chapterId}?content-type=html&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`
  );
  return data.data;
}

export async function searchBible(bibleId: string, query: string, limit = 10) {
  // GET /v1/bibles/{bibleId}/search?query=...
  const q = encodeURIComponent(query);
  const data = await fetchJson<{ data: { verses?: Array<{ id: string; reference: string; text: string }> }; query: string }>(
    `${BASE_URL}/v1/bibles/${bibleId}/search?query=${q}&limit=${limit}`
  );
  return (data.data.verses || []) as Array<{ id: string; reference: string; text: string }>;
}
