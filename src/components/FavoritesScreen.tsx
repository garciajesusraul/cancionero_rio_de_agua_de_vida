import React, { useState, useMemo } from 'react';
import { Song } from '../types';

type SortMode = 'alpha' | 'recent';

interface FavoritesScreenProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onOpenMenu: () => void;
  onToggleFavorite: (songId: string, e: React.MouseEvent) => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  songs,
  onSelectSong,
  onOpenMenu,
  onToggleFavorite,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('alpha');

  const sorted = useMemo(() => {
    const favs = [...songs];
    if (sortMode === 'alpha') {
      return favs.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
    }
    // recent: últimas agregadas primero (favoriteAt desc, fallback a orden actual)
    return favs.sort((a, b) => (b.favoriteAt || 0) - (a.favoriteAt || 0));
  }, [songs, sortMode]);

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto h-[100dvh] max-h-[100dvh] flex flex-col bg-white border border-[#c3c6d1] shadow-sm font-sans overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
        <h1 className="text-[15px] sm:text-base font-semibold text-[#191c1e] flex-1">Alabanzas favoritas</h1>
        <button
          onClick={onOpenMenu}
          className="shrink-0 bg-[#1A477A] text-white rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer hover:bg-[#00305d] active:scale-95 shadow-sm"
          title="Menú Principal"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">menu</span>
        </button>
      </header>

      {/* Filtros */}
      <div className="shrink-0 px-3 sm:px-4 py-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSortMode('alpha')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
            sortMode === 'alpha'
              ? 'bg-[#1A477A] text-white border-[#1A477A] shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A477A] hover:text-[#1A477A]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">sort_by_alpha</span>
          Orden alfabético
        </button>
        <button
          onClick={() => setSortMode('recent')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
            sortMode === 'recent'
              ? 'bg-[#1A477A] text-white border-[#1A477A] shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A477A] hover:text-[#1A477A]'
          }`}
        >
          Últimas agregadas
        </button>
      </div>

      {/* Listado */}
      <main className="flex-1 min-h-0 overflow-y-auto scroll-visible bg-[#f7f9fb] p-0">
        {sorted.length === 0 ? (
          <div className="text-center py-16 px-4">
            <span className="material-symbols-outlined text-4xl text-gray-300">favorite_border</span>
            <p className="text-sm text-gray-500 mt-2">Aún no hay favoritas</p>
            <p className="text-xs text-gray-400 mt-1">Tocá el corazón en cualquier canción para agregarla</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {sorted.map((song) => (
              <div
                key={song.id}
                onClick={() => onSelectSong(song)}
                className="px-4 py-4 flex items-center justify-between gap-3 hover:bg-[#f7f9fb] cursor-pointer group active:bg-[#f2f4f6] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium text-[#191c1e] group-hover:text-[#1A477A] truncate">{song.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block bg-[#f2f4f6] text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-100">
                      {song.tag === 'MIO' ? '#MIO' : '#RAV'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => onToggleFavorite(song.id, e)}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-[#191c1e] hover:bg-gray-100 cursor-pointer"
                  title="Quitar de favoritos"
                >
                  <span className="material-symbols-outlined text-xl filled text-black">favorite</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
