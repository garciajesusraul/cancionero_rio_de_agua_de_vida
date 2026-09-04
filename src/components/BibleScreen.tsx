import React, { useEffect, useState } from 'react';
import { ALLOWED_BIBLES, DEFAULT_BIBLE_ID, getBooks, getChapters, getChapterContent, searchBible } from '../utils/bibleApi';

interface BibleScreenProps {
  onOpenMenu: () => void;
}

export const BibleScreen: React.FC<BibleScreenProps> = ({ onOpenMenu }) => {
  const [bibleId, setBibleId] = useState<string>(() => {
    try { return localStorage.getItem('rav_bible_id') || DEFAULT_BIBLE_ID; } catch { return DEFAULT_BIBLE_ID; }
  });
  const [books, setBooks] = useState<Array<{ id: string; bibleId: string; abbreviation: string; name: string; nameLong: string }>>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(() => {
    try { return localStorage.getItem('rav_bible_book') || ''; } catch { return ''; }
  });
  const [chapters, setChapters] = useState<Array<{ id: string; bibleId: string; bookId: string; number: string; reference: string }>>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    try { return localStorage.getItem('rav_bible_chapter') || ''; } catch { return ''; }
  });
  const [chapterContent, setChapterContent] = useState<{ reference: string; content: string; copyright: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; reference: string; text: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [searchScope, setSearchScope] = useState<'all' | 'ot' | 'nt' | 'book'>('all');
  const [searchBookId, setSearchBookId] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Persist bible selection
  useEffect(() => { try { localStorage.setItem('rav_bible_id', bibleId); } catch {} }, [bibleId]);
  useEffect(() => { try { if (selectedBookId) localStorage.setItem('rav_bible_book', selectedBookId); } catch {} }, [selectedBookId]);
  useEffect(() => { try { if (selectedChapterId) localStorage.setItem('rav_bible_chapter', selectedChapterId); } catch {} }, [selectedChapterId]);

  // Load books when bible changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    setBooks([]); setChapters([]); setChapterContent(null);
    getBooks(bibleId).then((bs) => {
      if (cancelled) return;
      setBooks(bs);
      // auto-select first book if none or not in list
      if (!selectedBookId || !bs.find((b) => b.id === selectedBookId)) {
        const first = bs.find((b) => b.id.includes('GEN')) || bs[0];
        if (first) setSelectedBookId(first.id);
      }
      setLoading(false);
    }).catch((e) => { if (!cancelled) { setError(e.message || 'Error al cargar libros'); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleId]);

  // Load chapters when book changes
  useEffect(() => {
    if (!selectedBookId) return;
    let cancelled = false;
    setLoading(true); setError(null);
    setChapters([]); setChapterContent(null);
    getChapters(bibleId, selectedBookId).then((chs) => {
      if (cancelled) return;
      // api.bible includes intro chapter; filter numeric
      setChapters(chs);
      const numeric = chs.filter((c) => c.number !== 'intro');
      const first = numeric[0];
      if (first && (!selectedChapterId || !chs.find((c) => c.id === selectedChapterId))) {
        setSelectedChapterId(first.id);
      } else if (selectedChapterId && !chs.find((c) => c.id === selectedChapterId) && first) {
        setSelectedChapterId(first.id);
      }
      setLoading(false);
    }).catch((e) => { if (!cancelled) { setError(e.message || 'Error al cargar capítulos'); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBookId, bibleId]);

  // Load chapter content
  useEffect(() => {
    if (!selectedChapterId) return;
    let cancelled = false;
    setLoading(true); setError(null);
    getChapterContent(bibleId, selectedChapterId).then((data) => {
      if (cancelled) return;
      setChapterContent({ reference: data.reference, content: data.content, copyright: data.copyright });
      setLoading(false);
    }).catch((e) => { if (!cancelled) { setError(e.message || 'Error al cargar capítulo'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedChapterId, bibleId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); setError(null);
    try {
      // Para búsqueda avanzada pedimos más resultados y filtramos client-side por scope
      const fetchLimit = searchScope === 'all' ? 12 : 30;
      const res = await searchBible(bibleId, searchQuery.trim(), fetchLimit);
      let filtered = res;
      if (searchScope !== 'all') {
        if (searchScope === 'book' && searchBookId) {
          const book = books.find((b) => b.id === searchBookId);
          const abbr = (book?.abbreviation || book?.id || '').toUpperCase();
          const idPart = (book?.id || '').split('.').pop()?.toUpperCase() || abbr;
          filtered = res.filter((v) => v.id.toUpperCase().startsWith(idPart) || v.reference.toLowerCase().includes((book?.name || '').toLowerCase().split(' ')[0]));
          filtered = filtered.slice(0, 10);
        } else if (searchScope === 'ot' || searchScope === 'nt') {
          // OT = primeros 39 libros, NT = resto (orden canónico)
          const bookIndexMap = new Map<string, number>(books.map((b, i) => [b.id, i] as [string, number]));
          const bookAbbrMap = new Map<string, string>(books.map((b) => [b.id, b.abbreviation.toUpperCase()] as [string, string]));
          filtered = res.filter((v) => {
            // intentar mapear verse.id -> book
            const verseBookPart = v.id.split('.')[0].toUpperCase();
            // buscar book por abbreviation o id
            let idx = -1;
            for (const b of books) {
              if (verseBookPart === b.abbreviation.toUpperCase() || verseBookPart === b.id.toUpperCase().split('.').pop()) { idx = bookIndexMap.get(b.id) ?? -1; break; }
              if (bookAbbrMap.get(b.id) === verseBookPart) { idx = bookIndexMap.get(b.id) ?? -1; break; }
            }
            // fallback por referencia textual si no mapea
            if (idx === -1) {
              const refLower = v.reference.toLowerCase();
              for (let i = 0; i < books.length; i++) {
                if (refLower.startsWith(books[i].name.toLowerCase().split(' ')[0])) { idx = i; break; }
              }
            }
            if (idx === -1) return false;
            return searchScope === 'ot' ? idx < 39 : idx >= 39;
          }).slice(0, 10);
        }
      }
      setSearchResults(filtered);
      if (filtered.length === 0) setError('Sin resultados en ese ámbito. Probá con "Toda la Biblia".');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error en búsqueda');
    } finally { setSearching(false); }
  };

  const currentBook = books.find((b) => b.id === selectedBookId);
  const currentChapter = chapters.find((c) => c.id === selectedChapterId);

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto h-[100dvh] max-h-[100dvh] flex flex-col bg-white border border-[#c3c6d1] shadow-sm font-sans overflow-hidden relative">
      {/* Controles - se ocultan en fullscreen */}
      {!isFullscreen && (
      <div className="shrink-0 p-3 sm:p-4 space-y-3 bg-[#f7f9fb] border-b border-[#c3c6d1]/30">
        {/* Traducción - desplegable + menú flotante a la derecha */}
        <div className="flex gap-2 items-end">
          <div className="relative flex-1">
            <label className="text-[11px] font-bold tracking-widest text-[#43474f] uppercase block mb-1">Traducción</label>
            <select
              value={bibleId}
              onChange={(e) => setBibleId(e.target.value)}
              className="w-full appearance-none bg-white border border-[#c3c6d1] rounded-xl px-4 py-3 pr-10 text-sm font-medium text-[#1A477A] focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] cursor-pointer"
            >
              {ALLOWED_BIBLES.map((b) => (
                <option key={b.id} value={b.id}>{b.abbreviation} — {b.name}</option>
              ))}
            </select>
            <span className="absolute right-3 top-[34px] material-symbols-outlined text-[#1A477A] pointer-events-none text-xl">expand_more</span>
          </div>
          <button onClick={onOpenMenu} className="shrink-0 bg-[#1A477A] text-white rounded-full w-11 h-11 flex items-center justify-center cursor-pointer hover:bg-[#00305d] active:scale-95 shadow-md mb-[2px]" title="Menú Principal">
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>

        {/* Libro */}
        <div className="flex gap-2">
          <select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} className="flex-1 appearance-none bg-white border border-[#c3c6d1] rounded-xl px-3 py-3 pr-8 text-sm font-medium text-[#1A477A] focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] cursor-pointer">
            {books.length === 0 ? <option>Cargando libros...</option> : books.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {/* Capítulos chips */}
          <div className="flex-[1.2] flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {chapters.filter((c) => c.number !== 'intro').map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapterId(ch.id)}
                className={`shrink-0 w-9 h-9 rounded-lg text-sm font-bold border cursor-pointer ${selectedChapterId === ch.id ? 'bg-[#1A477A] text-white border-[#1A477A]' : 'bg-white text-[#43474f] border-[#c3c6d1] hover:bg-[#f2f4f6]'}`}
              >
                {ch.number}
              </button>
            ))}
          </div>
        </div>

        {/* Búsqueda avanzada - cuadro + opciones unidos mismo fondo */}
        <div className="bg-[#dce8f7] border border-[#c3c6d1]/50 rounded-xl p-2.5 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">search</span>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Buscar palabra o versículo..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
            </div>
            <button onClick={handleSearch} disabled={searching || !searchQuery.trim() || (searchScope === 'book' && !searchBookId)} className="px-4 py-2.5 bg-[#1A477A] text-white rounded-xl text-sm font-semibold hover:bg-[#00305d] disabled:opacity-40 cursor-pointer whitespace-nowrap">{searching ? 'Buscando...' : 'Buscar'}</button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#1A477A] pointer-events-none text-lg">expand_more</span>
              <select value={searchScope} onChange={(e) => setSearchScope(e.target.value as typeof searchScope)} className="w-full appearance-none bg-white border border-[#c3c6d1] rounded-xl px-3 py-2.5 pr-8 text-sm font-medium text-[#1A477A] focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] cursor-pointer">
                <option value="all">Toda la Biblia</option>
                <option value="ot">Antiguo Testamento</option>
                <option value="nt">Nuevo Testamento</option>
                <option value="book">Un libro específico</option>
              </select>
            </div>
            {searchScope === 'book' && (
              <select value={searchBookId} onChange={(e) => setSearchBookId(e.target.value)} className="flex-1 appearance-none bg-white border border-[#c3c6d1] rounded-xl px-3 py-2.5 pr-8 text-sm font-medium text-[#1A477A] focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] cursor-pointer">
                <option value="">Elegí libro...</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Font size + nav capítulo */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setFontSize((s) => Math.max(12, s - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#c3c6d1] text-[#43474f] hover:bg-[#f2f4f6] cursor-pointer text-xs font-bold">A-</button>
            <button onClick={() => setFontSize((s) => Math.min(24, s + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#c3c6d1] text-[#00305d] hover:bg-[#f2f4f6] cursor-pointer text-xs font-bold">A+</button>
            <span className="text-xs text-gray-500 ml-1">{fontSize}px</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                const idx = chapters.findIndex((c) => c.id === selectedChapterId);
                if (idx > 0) setSelectedChapterId(chapters[idx - 1].id);
              }}
              className="px-3 py-1.5 bg-white border border-[#c3c6d1] rounded-lg text-xs font-semibold hover:bg-[#f2f4f6] cursor-pointer"
            >
              ‹ Anterior
            </button>
            <button
              onClick={() => {
                const idx = chapters.findIndex((c) => c.id === selectedChapterId);
                if (idx >= 0 && idx < chapters.length - 1) setSelectedChapterId(chapters[idx + 1].id);
              }}
              className="px-3 py-1.5 bg-white border border-[#c3c6d1] rounded-lg text-xs font-semibold hover:bg-[#f2f4f6] cursor-pointer"
            >
              Siguiente ›
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Contenido - con botón flotante en esquina superior derecha */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 md:p-6 bg-white relative">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#c3c6d1]/40 text-xs font-semibold text-[#1A477A] shadow-sm hover:bg-white/90 transition-all cursor-pointer"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          <span className="material-symbols-outlined text-base">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
          <span className="hidden sm:inline">{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
        </button>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
        {loading && <div className="text-center py-8 text-gray-500 animate-pulse text-sm">Cargando...</div>}

        {/* Resultados búsqueda */}
        {searchResults.length > 0 && (
          <div className="mb-6 bg-[#f7f9fb] border border-[#c3c6d1]/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00305d]">Resultados</h3>
              <button onClick={() => setSearchResults([])} className="text-xs text-gray-500 hover:text-[#00305d] cursor-pointer">Cerrar</button>
            </div>
            {searchResults.map((v) => (
              <button key={v.id} onClick={() => { setSelectedChapterId(v.id.split('.').slice(0, 2).join('.')); setSearchResults([]); }} className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:bg-[#f2f4f6] cursor-pointer">
                <div className="text-xs font-bold text-[#1A477A]">{v.reference}</div>
                <div className="text-sm text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: v.text.slice(0, 180) }} />
              </button>
            ))}
          </div>
        )}

        {chapterContent ? (
          <article>
            <h2 className="text-lg sm:text-xl font-bold text-[#00305d] mb-1">{chapterContent.reference}</h2>
            {currentBook && currentChapter && <p className="text-xs text-gray-500 mb-4">{currentBook.name} {currentChapter.number} • {ALLOWED_BIBLES.find((b) => b.id === bibleId)?.abbreviation}</p>}
            <div
              className="prose prose-sm max-w-none text-gray-800 leading-relaxed bible-content"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{ __html: chapterContent.content }}
            />
            {chapterContent.copyright && <p className="mt-6 text-[11px] text-gray-400 border-t border-gray-100 pt-3" dangerouslySetInnerHTML={{ __html: chapterContent.copyright }} />}
          </article>
        ) : (
          !loading && <div className="text-center py-12 text-gray-400 text-sm">Seleccioná un libro y capítulo para leer</div>
        )}
      </main>

      <style>{`.bible-content .v { font-weight: 700; color: #1A477A; margin-right: 0.25em; font-size: 0.75em; vertical-align: super; } .bible-content p { margin-bottom: 0.75em; }`}</style>
    </div>
  );
};
