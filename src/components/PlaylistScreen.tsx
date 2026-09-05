import React, { useState, useRef } from 'react';
import { Song, Playlist, CipherSystem } from '../types';
import { parseChordProToTokens, convertLegacyLineToChordPro } from '../utils/chordParser';
import { transposeChordName } from '../data/chords';

interface PlaylistScreenProps {
  songs: Song[];
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onCreatePlaylist: (name: string) => void;
  onSelectPlaylist: (id: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddSong: (songId: string) => void;
  onRemoveSong: (songId: string, index: number) => void;
  onReorder: (newSongIds: string[]) => void;
  onOpenMenu: () => void;
  onPreviewSong?: (song: Song) => void;
  cipherSystem?: CipherSystem;
}

export const PlaylistScreen: React.FC<PlaylistScreenProps> = ({
  songs,
  playlists,
  selectedPlaylistId,
  onCreatePlaylist,
  onSelectPlaylist,
  onDeletePlaylist,
  onAddSong,
  onRemoveSong,
  onReorder,
  onOpenMenu,
  cipherSystem = 'American',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [previewSong, setPreviewSong] = useState<Song | null>(null);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [duplicateModal, setDuplicateModal] = useState<{ song: Song } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;
  const orderedPlaylists = [...playlists].sort((a, b) => b.createdAt - a.createdAt);

  const filteredSongs = searchTerm.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.tag.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 6)
    : [];

  const currentSongs = selectedPlaylist
    ? selectedPlaylist.songIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as Song[]
    : [];

  const handleMicClick = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setSearchTerm('Señor mi Dios');
    }, 1500);
  };

  const handleAddClick = (song: Song) => {
    if (!selectedPlaylist) {
      // si no hay lista seleccionada, avisar
      return;
    }
    const isDup = selectedPlaylist.songIds.includes(song.id);
    if (isDup) {
      setDuplicateModal({ song });
      return;
    }
    onAddSong(song.id);
    setSearchTerm('');
    setPreviewSong(null);
  };

  const handleDuplicateConfirm = (addAgain: boolean) => {
    if (!duplicateModal) return;
    if (addAgain) {
      onAddSong(duplicateModal.song.id);
      setSearchTerm('');
      setPreviewSong(null);
    }
    setDuplicateModal(null);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreatePlaylist(name);
    setNewName('');
    setShowNewInput(false);
  };

  // Drag & Drop - desktop mouse + touch
  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIdx = dragIndexRef.current;
    if (dragIdx === null || dragIdx === dropIndex || !selectedPlaylist) return;
    const newIds = [...selectedPlaylist.songIds];
    const [moved] = newIds.splice(dragIdx, 1);
    newIds.splice(dropIndex, 0, moved);
    onReorder(newIds);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  // Touch reorder - long press then drag
  const touchStartIndex = useRef<number | null>(null);
  const handleTouchStart = (index: number) => {
    touchStartIndex.current = index;
    dragIndexRef.current = index;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    // prevent scroll while dragging
    if (dragIndexRef.current !== null) e.preventDefault();
  };
  const handleTouchEnd = (e: React.TouchEvent, dropIndex: number) => {
    const dragIdx = dragIndexRef.current;
    if (dragIdx !== null && dragIdx !== dropIndex && selectedPlaylist) {
      const newIds = [...selectedPlaylist.songIds];
      const [moved] = newIds.splice(dragIdx, 1);
      newIds.splice(dropIndex, 0, moved);
      onReorder(newIds);
    }
    dragIndexRef.current = null;
    touchStartIndex.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto h-[100dvh] max-h-[100dvh] flex flex-col bg-white border border-[#c3c6d1] shadow-sm font-sans overflow-hidden">
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scroll-visible p-3 sm:p-4 md:p-6 space-y-4">
        {/* a) Bloque agrupado con fondo azul más oscuro - botón + dropdown relacionados */}
        <section className="space-y-3 bg-[#dbeafe] border border-[#93b4e8]/40 rounded-xl p-3 sm:p-4">
          <div className="flex gap-2 items-center">
            {!showNewInput ? (
              <button onClick={() => setShowNewInput(true)} className="flex-1 py-3.5 bg-[#1A477A] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#00305d] active:scale-[0.99] cursor-pointer shadow-sm">
                <span className="text-lg leading-none">+</span><span>AGREGAR NUEVA LISTA</span>
              </button>
            ) : (
              <div className="flex-1 bg-white border border-[#93b4e8] rounded-xl p-3 space-y-2 shadow-sm">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre de la lista..."
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNewInput(false); }}
                  className="w-full px-4 py-3 bg-white border border-[#c3c6d1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] font-medium"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowNewInput(false)} className="flex-1 py-2.5 bg-white border border-[#c3c6d1] rounded-lg text-sm font-semibold text-[#43474f] hover:bg-gray-50 cursor-pointer">Cancelar</button>
                  <button onClick={handleCreate} disabled={!newName.trim()} className="flex-1 py-2.5 bg-[#1A477A] text-white rounded-lg text-sm font-semibold hover:bg-[#00305d] disabled:opacity-40 cursor-pointer">Crear</button>
                </div>
              </div>
            )}
            <button onClick={onOpenMenu} className="shrink-0 bg-[#1A477A] text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer hover:bg-[#00305d] active:scale-95 shadow-sm" title="Menú Principal">
              <span className="material-symbols-outlined text-xl sm:text-2xl">menu</span>
            </button>
          </div>

          <label className="text-[11px] font-bold tracking-widest text-[#1A477A] uppercase">PLAYLIST GUARDADAS</label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <select
                value={selectedPlaylistId || ''}
                onChange={(e) => onSelectPlaylist(e.target.value)}
                className="w-full appearance-none bg-white border border-[#93b4e8] rounded-xl px-4 py-3.5 pr-10 text-sm font-medium text-[#1A477A] focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] cursor-pointer shadow-xs"
              >
                <option value="">{playlists.length === 0 ? 'Sin playlists — creá una' : 'Seleccioná una playlist'}</option>
                {orderedPlaylists.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#1A477A] pointer-events-none">expand_more</span>
            </div>
            <button
              onClick={() => { if (selectedPlaylistId) setDeleteConfirm(true); }}
              disabled={!selectedPlaylistId}
              className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border cursor-pointer transition-all ${selectedPlaylistId ? 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-xs' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}`}
              title={selectedPlaylistId ? `Eliminar "${selectedPlaylist?.name}"` : 'Seleccioná una playlist'}
            >
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
          </div>
        </section>

        {/* b) Barra búsqueda para agregar - con preview flotante por encima */}
        <section className="space-y-3 relative">
          <div className="relative shadow-xs rounded-xl border border-gray-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#3ED5B6]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar canciones..."
              className="block w-full pl-10 pr-10 py-3 border-none focus:outline-none text-sm text-gray-700 placeholder-gray-400 font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button type="button" onClick={handleMicClick} className={`p-1.5 rounded-full ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-[#1A477A] hover:bg-gray-100'}`}>
                <span className="material-symbols-outlined text-xl">mic</span>
              </button>
            </div>
          </div>

          {/* Resultados desplegables */}
          {searchTerm && (
            <div className="space-y-2">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500 bg-[#f7f9fb] rounded-xl border border-dashed border-[#c3c6d1]">No se encontraron canciones</div>
              ) : (
                filteredSongs.map((song) => (
                  <div key={song.id} className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3 shadow-xs">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#191c1e] truncate">{song.title}</div>
                      <div className="text-xs text-gray-500 truncate">({song.artist}) • {song.tag}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPreviewSong(song); }}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#c3c6d1] text-[#1A477A] hover:bg-[#f2f4f6] cursor-pointer shrink-0"
                        title="Vista previa"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddClick(song)}
                        disabled={!selectedPlaylist}
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-white font-bold text-lg cursor-pointer ${selectedPlaylist ? 'bg-[#1A477A] hover:bg-[#00305d] active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
                        title={selectedPlaylist ? 'Agregar a la lista' : 'Seleccioná una playlist primero'}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
              {!selectedPlaylist && filteredSongs.length > 0 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Seleccioná o creá una playlist arriba para poder agregar canciones.</p>
              )}
            </div>
          )}

          {/* Preview flotante POR ENCIMA tapando resultados (como en ejemplo) */}
          {previewSong && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[52px] w-[92%] max-w-[420px] z-30 bg-white border border-[#c3c6d1] rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-[#c3c6d1]/50">
                <div className="text-sm font-bold text-[#00305d] truncate">{previewSong.title} <span className="text-xs font-normal text-gray-500">— {previewSong.artist}</span></div>
                <button type="button" onClick={() => setPreviewSong(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f4f6] text-[#43474f] cursor-pointer">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto overflow-x-auto scroll-visible p-4 space-y-4 text-sm leading-relaxed bg-[#f7f9fb]">
                {previewSong.sections.map((sec, si) => (
                  <div key={si} className={sec.isChorus ? 'bg-[#f2f4f6] p-3 rounded-lg border-l-4 border-[#00305d]' : ''}>
                    {sec.title && <div className={`text-[11px] font-bold tracking-widest uppercase mb-2 ${sec.isChorus ? 'text-[#00305d]' : 'text-gray-500'}`}>{sec.title}</div>}
                    <div className="space-y-2">
                      {sec.lines.map((line, li) => {
                        const chordPro = line.chordPro || convertLegacyLineToChordPro(line.lyrics || '', line.chords);
                        const tokens = parseChordProToTokens(chordPro);
                        return (
                          <div key={li} className="flex flex-wrap items-end gap-y-1">
                            {tokens.map((word, wi) => (
                              <span key={wi} className="inline-flex items-end mr-1">
                                {word.segments.map((seg, sei) => {
                                  const tr = seg.chord ? transposeChordName(seg.chord, 0, cipherSystem as CipherSystem) : '';
                                  return (
                                    <span key={sei} className="inline-flex flex-col items-start">
                                      <span className={`text-[11px] font-bold font-mono leading-none min-h-[12px] ${seg.chord ? 'text-[#1A477A]' : 'opacity-0'}`}>{tr || '\u00A0'}</span>
                                      <span className="text-sm text-[#191c1e]">{seg.text}</span>
                                    </span>
                                  );
                                })}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 bg-white border-t border-[#c3c6d1]/30 flex justify-between items-center">
                <span className="text-[11px] text-gray-500">Vista previa — letra + acordes</span>
                <button type="button" onClick={() => { if (previewSong && selectedPlaylist) handleAddClick(previewSong); }} disabled={!selectedPlaylist} className={`px-4 py-1.5 rounded-full text-xs font-bold ${selectedPlaylist ? 'bg-[#1A477A] text-white hover:bg-[#00305d]' : 'bg-gray-200 text-gray-500'} cursor-pointer`}>+ Agregar</button>
              </div>
            </div>
          )}
        </section>

        {/* c) Lista Actual abajo - sin header "Lista Actual:" como pedido */}
        <section className="space-y-3">
          {selectedPlaylist && currentSongs.length > 0 && (
            <div className="text-xs text-gray-500 text-center">{selectedPlaylist.name} • {currentSongs.length} {currentSongs.length === 1 ? 'canción' : 'canciones'}</div>
          )}

          {!selectedPlaylist ? (
            <div className="text-center py-8 bg-[#f7f9fb] border border-dashed border-[#c3c6d1] rounded-xl">
              <p className="text-sm text-gray-500">Creá o seleccioná una playlist arriba</p>
              <p className="text-xs text-gray-400 mt-1">Usá “AGREGAR NUEVA LISTA” para empezar</p>
            </div>
          ) : currentSongs.length === 0 ? (
            <div className="text-center py-8 bg-[#f7f9fb] border border-dashed border-[#c3c6d1] rounded-xl">
              <p className="text-sm text-gray-500">Aún no hay canciones en esta lista</p>
              <p className="text-xs text-gray-400 mt-1">Buscá arriba y tocá “+” para agregar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentSongs.map((song, index) => {
                const isDragOver = dragOverIndex === index;
                return (
                  <div
                    key={`${song.id}-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(e, index)}
                    className={`bg-white border rounded-xl p-4 flex items-center gap-3 shadow-xs cursor-grab active:cursor-grabbing select-none transition-all ${isDragOver ? 'border-[#3ED5B6] bg-[#f2fdfb] scale-[1.01] shadow-md' : 'border-gray-100'}`}
                  >
                    <span className="material-symbols-outlined text-gray-300 text-lg cursor-grab shrink-0" title="Arrastrá para reordenar">drag_indicator</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base font-semibold text-[#1A477A] truncate">{song.title}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider truncate">{song.artist}</div>
                    </div>
                    <button
                      onClick={() => onRemoveSong(song.id, index)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#c3c6d1] text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 cursor-pointer shrink-0"
                      title="Quitar de la lista"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                );
              })}
              <p className="text-xs sm:text-sm text-gray-600 text-center px-2 font-medium">Para reordenar la lista, mantené presionada la canción y arrastrala</p>
            </div>
          )}
        </section>
      </main>

      {/* Modal duplicado */}
      {duplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#00305d]">Canción duplicada</h3>
            <p className="text-sm text-gray-600">“{duplicateModal.song.title}” ya está en “{selectedPlaylist?.name}”. ¿Querés agregarla de nuevo?</p>
            <div className="flex gap-3">
              <button onClick={() => handleDuplicateConfirm(false)} className="flex-1 py-3 bg-white border border-[#c3c6d1] rounded-xl text-sm font-semibold text-[#43474f] hover:bg-[#f2f4f6] cursor-pointer">No agregar</button>
              <button onClick={() => handleDuplicateConfirm(true)} className="flex-1 py-3 bg-[#1A477A] text-white rounded-xl text-sm font-semibold hover:bg-[#00305d] cursor-pointer">Volver a agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar lista */}
      {deleteConfirm && selectedPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#ba1a1a] flex items-center gap-2"><span className="material-symbols-outlined">warning</span> Eliminar lista</h3>
            <p className="text-sm text-gray-600">¿Seguro que querés eliminar <span className="font-bold text-[#1A477A]">“{selectedPlaylist.name}”</span>? Se borrarán {selectedPlaylist.songIds.length} canciones de la lista.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-3 bg-white border border-[#c3c6d1] rounded-xl text-sm font-semibold text-[#43474f] hover:bg-[#f2f4f6] cursor-pointer">Cancelar</button>
              <button onClick={() => { onDeletePlaylist(selectedPlaylist.id); setDeleteConfirm(false); }} className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl text-sm font-semibold hover:bg-[#990000] cursor-pointer flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-lg">delete</span> Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
