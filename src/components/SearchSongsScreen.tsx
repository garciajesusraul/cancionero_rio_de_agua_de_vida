import React, { useState } from 'react';
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

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClearRecent = () => {
    setRecentList([]);
  };

  const handleMicClick = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setSearchTerm('Señor mi Dios');
    }, 1800);
  };

  return (
    <div className="w-full max-w-[440px] md:max-w-xl mx-auto min-h-screen flex flex-col bg-white border border-[#c3c6d1] shadow-sm font-sans">
      {/* Header */}
      <header className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
        {/* Spiritual Quote - centrado Oleo Script exacto como pedido */}
        <div className="flex-grow leading-tight text-center px-2">
          <p
            className="text-[17px] md:text-[19px] leading-snug text-gray-800"
            style={{ fontFamily: "'Oleo Script', cursive" }}
          >
            "El Padre busca verdaderos adoradores, que lo adoraren en espíritu y verdad"
            <span style={{ marginLeft: '0.6em' }}>Juan 4.24/25</span>
          </p>
        </div>

        {/* Hamburger Menu Icon (Top Right) */}
        <button
          onClick={onOpenMenu}
          className="flex-shrink-0 bg-[#1A477A] text-white rounded-full p-2.5 w-11 h-11 flex items-center justify-center cursor-pointer hover:bg-[#00305d] transition-transform active:scale-95 shadow-sm"
          title="Menú Principal"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="relative shadow-xs rounded-xl border border-gray-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#3ED5B6] transition-all">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <span className="material-symbols-outlined text-2xl">search</span>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Busca la canción..."
              className="block w-full pl-12 pr-12 py-4 border-none focus:outline-none text-lg text-gray-700 placeholder-gray-400 font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <button
                onClick={handleMicClick}
                className={`p-1.5 rounded-full transition-all ${
                  isListening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'text-[#1A477A] hover:bg-gray-100'
                }`}
                title={isListening ? 'Escuchando...' : 'Búsqueda por voz'}
              >
                <span className="material-symbols-outlined text-2xl">mic</span>
              </button>
            </div>
          </div>
          {isListening && (
            <div className="mt-2 text-center text-xs text-[#1A477A] font-semibold animate-pulse">
              🎤 Escuchando... Di el nombre de una canción
            </div>
          )}
        </div>

        {/* Section Title */}
        <div className="flex justify-between items-end px-1">
          <h2 className="text-xl font-bold text-gray-800">
            {searchTerm ? 'Resultados de búsqueda' : 'Búsquedas recientes'}
          </h2>
          {!searchTerm && recentList.length > 0 && (
            <button
              onClick={handleClearRecent}
              className="text-[#1A477A] text-sm font-semibold hover:underline cursor-pointer"
            >
              Borrar todo
            </button>
          )}
        </div>

        {/* Song List */}
        <section className="space-y-4">
          {(searchTerm ? filteredSongs : recentList).map((song) => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song)}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex justify-between items-center group active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-xl font-medium text-gray-800 group-hover:text-[#1A477A] transition-colors">
                    {song.title}
                  </h3>
                  {song.tag === 'CONGRE' ? (
                    <span className="bg-[#DCFCE7] text-[#166534] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                      CONGRE
                    </span>
                  ) : (
                    <span className="bg-[#E2E8F0] text-[#1A477A] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                      MIO
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-base font-normal">({song.artist})</p>
              </div>

              <button
                onClick={(e) => onToggleFavorite(song.id, e)}
                className={`p-2 rounded-full transition-colors ${
                  song.isFavorite
                    ? 'text-red-500'
                    : 'text-gray-400 hover:text-red-500'
                }`}
                title={song.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${
                    song.isFavorite ? 'filled' : ''
                  }`}
                >
                  favorite
                </span>
              </button>
            </div>
          ))}

          {(searchTerm ? filteredSongs : recentList).length === 0 && (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <span className="material-symbols-outlined text-4xl">search_off</span>
              <p className="text-sm font-medium">No se encontraron canciones</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
