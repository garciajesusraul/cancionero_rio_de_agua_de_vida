import React, { useState } from 'react';
import { Song } from '../types';

interface AllSongsScreenProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onOpenMenu: () => void;
  onToggleFavorite: (songId: string, e: React.MouseEvent) => void;
  onDeleteSong?: (songId: string) => void;
}

export const AllSongsScreen: React.FC<AllSongsScreenProps> = ({
  songs,
  onSelectSong,
  onOpenMenu,
  onToggleFavorite,
  onDeleteSong,
}) => {
  // Solo dos pestañas por defecto: #MIO y #RAV en mayúsculas (como pedido)
  const allTabs = ['#MIO', '#RAV'] as const;
  const [activeTab, setActiveTab] = useState<string>('#MIO');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = songs.filter((s) => {
    if (activeTab === '#MIO') return s.tag === 'MIO';
    if (activeTab === '#RAV') return s.tag === 'CONGRE';
    return s.tag === 'CONGRE';
  });

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto h-[100dvh] max-h-[100dvh] flex flex-col bg-white border border-[#c3c6d1] shadow-sm font-sans overflow-hidden">
      {/* Header con tabs + menú */}
      <header className="shrink-0 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 px-2 sm:px-3 pt-3 pb-0">
          <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-thin">
            {allTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[72px] sm:min-w-[90px] px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-t-xl border-t border-l border-r transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#f2f4f6] text-[#1A477A] border-[#1A477A] border-b-transparent shadow-sm'
                      : 'bg-white text-gray-500 border-transparent hover:bg-[#f7f9fb] hover:text-[#1A477A] border-b border-gray-200'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <button
            onClick={onOpenMenu}
            className="shrink-0 bg-[#1A477A] text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer hover:bg-[#00305d] active:scale-95 shadow-sm mb-2"
            title="Menú Principal"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">menu</span>
          </button>
        </div>
        <div className="h-px bg-gray-200 mx-2 sm:mx-3" />
      </header>

      {/* Backdrop para cerrar menú al tocar fuera */}
      {openMenuId && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />
      )}
      {/* Confirmación eliminar */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#00305d]">¿Eliminar canción?</h3>
            <p className="text-sm text-gray-600">Esta acción no se puede deshacer. Se borrará de todas las listas.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm font-bold text-[#43474f] hover:bg-[#f2f4f6] cursor-pointer">Cancelar</button>
              <button
                onClick={() => {
                  if (onDeleteSong && confirmDeleteId) onDeleteSong(confirmDeleteId);
                  setConfirmDeleteId(null);
                  setOpenMenuId(null);
                }}
                className="flex-1 py-2.5 bg-[#ba1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#a01818] cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado */}
      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-3 bg-[#f7f9fb]">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-[#c3c6d1] rounded-xl">
            <p className="text-sm text-gray-500">No hay alabanzas en {activeTab}</p>
          </div>
        ) : (
          filtered.map((song) => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:border-[#c3c6d1] cursor-pointer group active:scale-[0.99] transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[15px] sm:text-[16px] font-medium text-[#191c1e] group-hover:text-[#1A477A] truncate">{song.title}</div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">{song.artist}</div>
                <span className="inline-block mt-1.5 bg-[#f2f4f6] text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-100">{song.tag === 'MIO' ? '#MIO' : '#RAV'}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Corazón favorito - como en referencia */}
                <button
                  onClick={(e) => onToggleFavorite(song.id, e)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${song.isFavorite ? 'text-[#1A477A]' : 'text-[#1A477A] hover:bg-[#f2f4f6]'}`}
                  title={song.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                >
                  <span className={`material-symbols-outlined text-xl ${song.isFavorite ? 'filled' : ''}`}>
                    {song.isFavorite ? 'favorite' : 'favorite_border'}
                  </span>
                </button>

                {/* Menú tres puntos - eliminar canción */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === song.id ? null : song.id);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1A477A] hover:bg-[#f2f4f6] cursor-pointer"
                    title="Más opciones"
                  >
                    <span className="material-symbols-outlined text-xl">more_vert</span>
                  </button>
                  {openMenuId === song.id && (
                    <div
                      className="absolute right-0 top-full mt-1 bg-white border border-[#c3c6d1] rounded-xl shadow-xl z-10 min-w-[160px] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          setConfirmDeleteId(song.id);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-[#ba1a1a] hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Eliminar canción
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};
