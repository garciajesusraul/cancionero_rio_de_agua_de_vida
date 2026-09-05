import React, { useState, useEffect } from 'react';
import { Song } from '../types';

interface SearchSongsScreenProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onOpenMenu: () => void;
  onToggleFavorite: (songId: string, e: React.MouseEvent) => void;
}

export const SearchSongsScreen: React.FC<SearchSongsScreenProps> = ({
  songs,
  onSelectSong,
  onOpenMenu,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentList, setRecentList] = useState<Song[]>(songs.slice(0, 4));
  const [isListening, setIsListening] = useState(false);

  // Sincroniza isFavorite/favoriteAt en recientes cuando cambia el estado global
  useEffect(() => {
    setRecentList((prev) =>
      prev.map((r) => {
        const updated = songs.find((s) => s.id === r.id);
        return updated ? { ...r, isFavorite: updated.isFavorite, favoriteAt: updated.favoriteAt } : r;
      })
    );
  }, [songs]);

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClearRecent = () => setRecentList([]);
  const handleMicClick = () => {
    setIsListening(true);
    setTimeout(() => { setIsListening(false); setSearchTerm('Señor mi Dios'); }, 1800);
  };

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto h-[100dvh] max-h-[100dvh] flex flex-col bg-white border border-[#c3c6d1] shadow-sm font-sans overflow-hidden">
      <header className="shrink-0 p-3 sm:p-4 md:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex-grow leading-tight text-center px-1">
          <p className="text-[11px] sm:text-[13px] md:text-[15px] lg:text-[16px] leading-snug text-gray-800" style={{ fontFamily: "'Sniglet', cursive" }}>
            "Esta es tu <span className="font-bold">verdadera adoración</span>, que, por las misericordias de Dios, presentes tu cuerpo como un sacrificio que está viviendo santa y agradablemente ante Dios"
            <span style={{ marginLeft: '0.5em' }}>Romanos 12:1</span>
          </p>
        </div>
        <button onClick={onOpenMenu} className="shrink-0 bg-[#1A477A] text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer hover:bg-[#00305d] active:scale-95 shadow-sm" title="Menú Principal">
          <span className="material-symbols-outlined text-xl sm:text-2xl">menu</span>
        </button>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scroll-visible p-3 sm:p-4 md:p-6 space-y-4">
        <div className="relative shrink-0">
          <div className="relative shadow-xs rounded-xl border border-gray-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#3ED5B6]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Busca la canción..." className="block w-full pl-10 pr-10 py-3 border-none focus:outline-none text-sm sm:text-base text-gray-700 placeholder-gray-400 font-medium" />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button onClick={handleMicClick} className={`p-1.5 rounded-full ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-[#1A477A] hover:bg-gray-100'}`}>
                <span className="material-symbols-outlined text-xl">mic</span>
              </button>
            </div>
          </div>
          {isListening && <div className="mt-1.5 text-center text-[11px] text-[#1A477A] font-semibold animate-pulse">🎤 Escuchando...</div>}
        </div>

        <div className="flex justify-between items-end px-1 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">{searchTerm ? 'Resultados de búsqueda' : 'Búsquedas recientes'}</h2>
          {!searchTerm && recentList.length > 0 && <button onClick={handleClearRecent} className="text-[#1A477A] text-xs sm:text-sm font-semibold hover:underline cursor-pointer">Borrar todo</button>}
        </div>

        <section className="space-y-2 sm:space-y-3">
          {(searchTerm ? filteredSongs : recentList).map((song) => (
            <div key={song.id} onClick={() => onSelectSong(song)} className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-md cursor-pointer flex justify-between items-center group active:scale-[0.99] gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-medium text-gray-800 group-hover:text-[#1A477A] truncate">{song.title}</h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase shrink-0 ${song.tag === 'CONGRE' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#E2E8F0] text-[#1A477A]'}`}>{song.tag}</span>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm truncate">({song.artist})</p>
              </div>
              <button onClick={(e) => onToggleFavorite(song.id, e)} className={`shrink-0 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full ${song.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                <span className={`material-symbols-outlined text-xl sm:text-2xl ${song.isFavorite ? 'filled' : ''}`}>favorite</span>
              </button>
            </div>
          ))}
          {(searchTerm ? filteredSongs : recentList).length === 0 && (
            <div className="text-center py-8 text-gray-400 space-y-2"><span className="material-symbols-outlined text-3xl">search_off</span><p className="text-xs font-medium">No se encontraron canciones</p></div>
          )}
        </section>
      </main>
    </div>
  );
};
