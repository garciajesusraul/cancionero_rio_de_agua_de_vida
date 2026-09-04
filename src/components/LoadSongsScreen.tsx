import React, { useState, useRef, useEffect } from 'react';
import { Song, Category } from '../types';
import { parseHeaderAndBody, splitBulkFile, parseSpacedSongBody } from '../utils/songParser';
import { parseChordProToTokens } from '../utils/chordParser';
import { transposeChordName } from '../data/chords';
import { audioEngine } from '../utils/AudioEngine';

interface LoadSongsScreenProps {
  onSaveSong: (song: Song) => void;
  onSaveBulk: (songs: Song[]) => void;
  onOpenMenu: () => void;
  availableCategories: Category[];
  defaultCategory: string;
  isAdmin: boolean;
}

export const LoadSongsScreen: React.FC<LoadSongsScreenProps> = ({
  onSaveSong,
  onSaveBulk,
  onOpenMenu,
  availableCategories,
  defaultCategory,
  isAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');

  // Manual form
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [tone, setTone] = useState('G');
  const [bpm, setBpm] = useState(70);
  const [isMetroPlaying, setIsMetroPlaying] = useState(false);
  const [category, setCategory] = useState(defaultCategory);
  const [body, setBody] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [transpose, setTranspose] = useState(0);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Bulk
  const [bulkReport, setBulkReport] = useState<{ ok: Song[]; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const metroRef = useRef<number | null>(null);

  useEffect(() => { setCategory(defaultCategory); }, [defaultCategory]);

  // Metrónomo simple con audioEngine
  useEffect(() => {
    return () => { audioEngine.stopAll(); if (metroRef.current) clearInterval(metroRef.current); };
  }, []);
  const toggleMetronome = () => {
    if (isMetroPlaying) {
      audioEngine.stopAll();
      if (metroRef.current) clearInterval(metroRef.current);
      setIsMetroPlaying(false);
      return;
    }
    audioEngine.setBpm(bpm);
    // usar drum como metrónomo
    audioEngine.setDrumActive(true);
    audioEngine.setPadActive(false);
    const playing = audioEngine.togglePlay();
    setIsMetroPlaying(playing);
    // si no usa audioEngine, fallback interval visual
    if (!playing) {
      // already handled
    }
  };
  useEffect(() => { if (isMetroPlaying) audioEngine.setBpm(bpm); }, [bpm, isMetroPlaying]);

  const handleManualSave = () => {
    setManualError(null); setManualSuccess(null);
    if (!title.trim()) { setManualError('Falta Título'); return; }
    const raw = `Titulo=${title.trim()}\nGrupo=${artist.trim() || 'Desconocido'}\nTono=${tone.trim() || 'C'}\nBPM=${bpm}\nCategoria=${category}\n\n${body}`;
    const parsed = parseHeaderAndBody(raw, category);
    if ('error' in parsed || !('song' in parsed)) { setManualError((parsed as { error: string }).error); return; }
    onSaveSong((parsed as { song: Song }).song);
    setManualSuccess(`Guardada "${title}" en ${category} • BPM ${bpm} • Tono ${tone}`);
    // limpiar título/body para siguiente
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const blocks = splitBulkFile(text);
    const ok: Song[] = [];
    const errors: string[] = [];
    blocks.forEach((blk, idx) => {
      const res = parseHeaderAndBody(blk, isAdmin ? category : defaultCategory);
      if ('song' in res && (res as { song: Song }).song) ok.push((res as { song: Song }).song);
      else errors.push(`Bloque ${idx + 1}: ${(res as { error: string }).error} — "${blk.slice(0, 60).replace(/\n/g, ' ')}..."`);
    });
    setBulkReport({ ok, errors });
  };

  const handleBulkSave = () => {
    if (!bulkReport || bulkReport.ok.length === 0) return;
    onSaveBulk(bulkReport.ok);
    setBulkReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Preview sections
  const previewSections = (() => {
    try { return parseSpacedSongBody(body); } catch { return []; }
  })();

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto h-[100dvh] max-h-[100dvh] flex flex-col bg-white border border-[#c3c6d1] shadow-sm font-sans overflow-hidden">
      <header className="shrink-0 p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <h1 className="text-base sm:text-lg font-bold text-[#00305d]">Cargar canciones</h1>
        <button onClick={onOpenMenu} className="shrink-0 bg-[#1A477A] text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer hover:bg-[#00305d] shadow-sm"><span className="material-symbols-outlined text-xl">menu</span></button>
      </header>

      <div className="shrink-0 flex gap-2 p-2 bg-[#f7f9fb] border-b border-[#c3c6d1]/30">
        <button onClick={() => setActiveTab('manual')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer ${activeTab === 'manual' ? 'bg-[#1A477A] text-white border-[#1A477A]' : 'bg-white text-[#43474f] border-[#c3c6d1]'}`}>Manual</button>
        <button onClick={() => setActiveTab('bulk')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border cursor-pointer ${activeTab === 'bulk' ? 'bg-[#1A477A] text-white border-[#1A477A]' : 'bg-white text-[#43474f] border-[#c3c6d1]'}`}>Masiva .txt</button>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4">
        {activeTab === 'manual' ? (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#43474f] uppercase">Título *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Al que está sentado en el trono" className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#43474f] uppercase">Grupo / Artista</label>
                <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Mike Bunster" className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#43474f] uppercase">Tono (opcional)</label>
                <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="G" className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#43474f] uppercase">Categoría</label>
                {isAdmin ? (
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] cursor-pointer">
                    {availableCategories.map((c) => <option key={c.id} value={c.label}>{c.label} — {c.name}</option>)}
                  </select>
                ) : (
                  <input value={category} readOnly className="w-full px-3 py-2.5 bg-[#f2f4f6] border border-[#c3c6d1] rounded-xl text-sm text-[#43474f]" />
                )}
              </div>
            </div>

            <div className="bg-[#dce8f7] border border-[#c3c6d1]/40 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#43474f] uppercase">BPM (opcional)</label>
                <span className="text-xs font-bold text-[#00305d] bg-white px-2 py-1 rounded-full border border-[#c3c6d1]">{bpm}</span>
              </div>
              <div className="flex gap-2 items-center">
                <input type="range" min={40} max={200} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="flex-1 accent-[#1A477A] cursor-pointer" />
                <button type="button" onClick={toggleMetronome} className={`w-11 h-11 flex items-center justify-center rounded-full border cursor-pointer shrink-0 ${isMetroPlaying ? 'bg-[#1A477A] text-white border-[#1A477A] animate-pulse' : 'bg-white text-[#1A477A] border-[#c3c6d1] hover:bg-[#f2f4f6]'}`} title={isMetroPlaying ? 'Detener metrónomo' : 'Probar BPM'}>
                  <span className="material-symbols-outlined text-lg">{isMetroPlaying ? 'stop' : 'play_arrow'}</span>
                </button>
              </div>
              <div className="bg-[#eaf2ff] border border-[#c3c6d1]/30 rounded-lg px-3 py-2 text-[11px] text-[#43474f] text-center">Si no elegís BPM queda el estándar de la app (70).</div>
            </div>

            <div className="space-y-2">
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Colocá la canción acá..." className="w-full h-[320px] sm:h-[380px] p-4 bg-white border-2 border-[#0ea5e9] rounded-xl text-sm font-mono leading-5 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 whitespace-pre overflow-auto placeholder:text-gray-400" spellCheck={false} />
            </div>

            <div className="flex items-center gap-1.5 bg-[#f1f5f9] border border-gray-200 rounded-xl px-2 py-2">
              <button onClick={() => setFontSize((s) => Math.max(10, s - 1))} className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold cursor-pointer hover:bg-gray-50">A-</button>
              <button onClick={() => setFontSize((s) => Math.min(26, s + 1))} className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold cursor-pointer hover:bg-gray-50">A+</button>
              <button onClick={() => setTranspose((t) => t - 1)} className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold cursor-pointer hover:bg-gray-50">- ♪</button>
              <button onClick={() => setTranspose(0)} className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-[11px] font-bold cursor-pointer hover:bg-gray-50">Orig.</button>
              <button onClick={() => setTranspose((t) => t + 1)} className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold cursor-pointer hover:bg-gray-50">+ ♪</button>
              <span className="text-sm font-semibold text-gray-500 ml-auto">Vista previa abajo</span>
            </div>

            {/* Preview con acordes sincronizados */}
            <div className="border border-[#c3c6d1]/50 rounded-xl bg-white p-4 space-y-4 overflow-x-auto">
              {previewSections.length === 0 ? <p className="text-xs text-gray-400">Escribí el cuerpo arriba para ver preview</p> : previewSections.map((sec, si) => (
                <div key={si} className={sec.isChorus ? 'bg-[#f2f4f6] p-3 rounded-lg border-l-4 border-[#00305d]' : ''}>
                  {sec.title && <div className={`text-[11px] font-bold tracking-widest uppercase mb-2 ${sec.isChorus ? 'text-[#00305d]' : 'text-gray-500'}`}>{sec.title}</div>}
                  <div className="space-y-3">
                    {sec.lines.map((line, li) => {
                      const tokens = parseChordProToTokens(line.chordPro || '');
                      return (
                        <div key={li} className="flex flex-wrap items-end gap-y-1">
                          {tokens.map((word, wi) => (
                            <span key={wi} className="inline-flex items-end mr-[0.3em]">
                              {word.segments.map((seg, sei) => {
                                const chord = seg.chord ? transposeChordName(seg.chord, transpose) : '';
                                return (
                                  <span key={sei} className="inline-flex flex-col items-start">
                                    <span style={{ fontSize: `${Math.max(10, Math.round(fontSize * 0.72))}px`, minHeight: `${Math.max(12, Math.round(fontSize * 0.85))}px`, lineHeight: '1' }} className={`font-bold font-mono ${seg.chord ? 'text-[#1A477A]' : 'opacity-0'}`}>{chord || '\u00A0'}</span>
                                    <span style={{ fontSize: `${fontSize}px`, lineHeight: '1.2' }} className="text-[#191c1e] whitespace-pre">{seg.text}</span>
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

            {manualError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{manualError}</div>}
            {manualSuccess && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{manualSuccess}</div>}

            <button onClick={handleManualSave} className="w-full py-3.5 bg-[#1A477A] text-white rounded-xl font-bold text-sm hover:bg-[#00305d] active:scale-[0.99] cursor-pointer shadow-sm">Guardar canción en {category}</button>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="bg-[#f7f9fb] border border-[#c3c6d1]/40 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#00305d]">Carga masiva .txt</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Subí un archivo .txt donde cada canción está separada por una línea larga de guiones: <code className="px-1 py-0.5 bg-white border border-gray-200 rounded text-[11px]">-----------------------------------</code>. Cada bloque debe empezar con <code className="text-[11px]">Titulo=</code> (o primera línea como título) y puede incluir <code className="text-[11px]">Grupo=</code>, <code className="text-[11px]">Tono=</code>, <code className="text-[11px]">BPM=</code>. El cuerpo con acordes espaciados igual que en manual. Las distancias se respetan tal cual.</p>
              <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFile} className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#1A477A] file:text-white file:text-xs file:font-bold hover:file:bg-[#00305d] cursor-pointer" />
              <p className="text-[11px] text-gray-500">Si sos admin, las canciones se guardarán en la categoría seleccionada arriba ({category}); si no, siempre en #MIO. Categorías nuevas solo las crea el admin en Panel Admin.</p>
            </div>

            {bulkReport && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-sm font-bold text-green-800">Listas para guardar: {bulkReport.ok.length}</div>
                  {bulkReport.ok.length > 0 && <ul className="text-xs text-green-700 mt-1 space-y-0.5 max-h-[120px] overflow-y-auto">{bulkReport.ok.map((s) => <li key={s.id}>• {s.title} — {s.artist} [{s.originalKey}] BPM {s.bpm} {s.category}</li>)}</ul>}
                </div>
                {bulkReport.errors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="text-sm font-bold text-red-800">Errores (se saltean): {bulkReport.errors.length}</div>
                    <ul className="text-xs text-red-700 mt-1 space-y-1 max-h-[120px] overflow-y-auto">{bulkReport.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
                  </div>
                )}
                <button onClick={handleBulkSave} disabled={bulkReport.ok.length === 0} className="w-full py-3.5 bg-[#1A477A] text-white rounded-xl font-bold text-sm hover:bg-[#00305d] disabled:opacity-40 cursor-pointer">Guardar {bulkReport.ok.length} canciones en {isAdmin ? category : '#MIO'}</button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
