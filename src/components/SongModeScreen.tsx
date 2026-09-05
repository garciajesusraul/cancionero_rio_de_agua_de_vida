import React, { useState, useEffect, useRef } from 'react';
import { Song, CipherSystem, Category } from '../types';
import { CHORD_DIAGRAMS, transposeChordName } from '../data/chords';
import { audioEngine } from '../utils/AudioEngine';
import { parseChordProToTokens, convertLegacyLineToChordPro } from '../utils/chordParser';
import { parseSpacedSongBody } from '../utils/songParser';

export const ADMIN_EMAIL = 'cancionerorav@gmail.com';

function chordProToSpacedPair(chordPro: string): { chordLine: string; lyricLine: string } {
  if (!chordPro) return { chordLine: '', lyricLine: '' };
  const regex = /\[([^\]]+)\]|([^\[]+)/g;
  let lyric = '';
  const chords: { chord: string; pos: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(chordPro)) !== null) {
    if (m[1] !== undefined) {
      chords.push({ chord: m[1], pos: lyric.length });
    } else if (m[2] !== undefined) {
      lyric += m[2];
    }
  }
  if (chords.length === 0) return { chordLine: '', lyricLine: lyric };
  if (!lyric.trim()) {
    return { chordLine: chords.map((c) => `[${c.chord}]`).join(' '), lyricLine: '' };
  }
  const chordChars = Array(lyric.length).fill(' ');
  // place chords, handle overflow
  let maxLen = lyric.length;
  chords.forEach((c) => {
    const end = c.pos + c.chord.length;
    if (end > maxLen) maxLen = end;
  });
  const lineArr = Array(maxLen).fill(' ');
  chords.forEach((c) => {
    for (let i = 0; i < c.chord.length; i++) {
      if (c.pos + i < lineArr.length) lineArr[c.pos + i] = c.chord[i];
    }
  });
  // trim trailing spaces
  let chordLine = lineArr.join('').replace(/\s+$/, '');
  return { chordLine, lyricLine: lyric };
}

function serializeSectionsToBody(sections: Song['sections']): string {
  const out: string[] = [];
  sections.forEach((sec) => {
    if (sec.title) out.push(sec.title);
    sec.lines.forEach((line) => {
      const cp = line.chordPro || convertLegacyLineToChordPro(line.lyrics || '', line.chords);
      const { chordLine, lyricLine } = chordProToSpacedPair(cp);
      if (chordLine) out.push(chordLine);
      out.push(lyricLine);
    });
    out.push(''); // blank line between sections
  });
  return out.join('\n').trim();
}

interface SongModeScreenProps {
  song: Song;
  onBack: () => void;
  onOpenMenu?: () => void;
  onOpenSettings?: () => void;
  cipherSystem?: CipherSystem;
  onUpdateSong?: (song: Song) => void;
  isAdmin?: boolean;
  authEmail?: string;
  availableCategories?: Category[];
  userCategories?: string[];
}

export const SongModeScreen: React.FC<SongModeScreenProps> = ({
  song,
  onBack,
  onOpenMenu,
  onOpenSettings,
  cipherSystem = 'American',
  onUpdateSong,
  isAdmin = false,
  authEmail = '',
  availableCategories = [],
  userCategories = [],
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(song.bpm || 70);
  const [isDrumActive, setIsDrumActive] = useState(true);
  const [isPadActive, setIsPadActive] = useState(true);
  const [semitones, setSemitones] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Edit mode
  const canEdit = isAdmin || authEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editTone, setEditTone] = useState('');
  const [editBpm, setEditBpm] = useState(70);
  const [editCategory, setEditCategory] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setBpm(song.bpm || 70);
    setSemitones(0);
  }, [song.id]);

  const scrollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      audioEngine.stopAll();
      if (scrollRef.current) clearInterval(scrollRef.current);
    };
  }, []);

  // Sincroniza el pad worship: cada acorde cambia cuando cambia en la canción (no cada 4 tiempos fijo)
  // Eficiencia: por línea, 4 tiempos se reparten entre los acordes de esa línea (ej: 2 acordes => 2 tiempos c/u)
  useEffect(() => {
    const sequence: { acorde: string; tiempos: number }[] = [];
    song.sections.forEach((sec) =>
      sec.lines.forEach((line) => {
        const cp = line.chordPro || convertLegacyLineToChordPro(line.lyrics || '', line.chords);
        const ms = cp.match(/\[([^\]]+)\]/g);
        if (!ms || ms.length === 0) return;
        const beatsPerChord = 4 / ms.length; // 1 acorde=4t, 2=2t, 3=1.33t → cambia exactamente al cambiar el acorde en la letra
        ms.forEach((m) => {
          const raw = m.slice(1, -1);
          const tr = transposeChordName(raw, semitones, cipherSystem as CipherSystem);
          sequence.push({ acorde: tr, tiempos: beatsPerChord });
        });
      })
    );
    if (sequence.length === 0) return;
    audioEngine.setPadSequence(sequence);
    audioEngine.setBpm(bpm);
  }, [song, semitones, cipherSystem, bpm]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    const playing = audioEngine.togglePlay();
    setIsPlaying(playing);
  };

  // Handle BPM change
  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    audioEngine.setBpm(newBpm);
  };

  // Handle drum toggle
  const handleToggleDrum = () => {
    const next = !isDrumActive;
    setIsDrumActive(next);
    audioEngine.setDrumActive(next);
  };

  // Handle pad toggle
  const handleTogglePad = () => {
    const next = !isPadActive;
    setIsPadActive(next);
    audioEngine.setPadActive(next);
  };

  // Transposition
  const handleTranspose = (steps: number) => {
    setSemitones((prev) => prev + steps);
  };

  const handleResetTranspose = () => {
    setSemitones(0);
  };

  // Font size
  const handleChangeFontSize = (delta: number) => {
    setFontSize((prev) => Math.max(12, Math.min(36, prev + delta)));
  };

  // Chord Popover
  const handleChordClick = (chord: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSelectedChord(chord);
    setPopoverPos({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 180,
    });
  };

  // Auto-scroll
  const handleToggleAutoScroll = () => {
    if (isAutoScrolling) {
      if (scrollRef.current) clearInterval(scrollRef.current);
      scrollRef.current = null;
      setIsAutoScrolling(false);
    } else {
      setIsAutoScrolling(true);
      scrollRef.current = window.setInterval(() => {
        window.scrollBy(0, scrollSpeed * 1.5);
      }, 30);
    }
  };

  // Fullscreen
  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Edit handlers
  const handleEnterEdit = () => {
    if (!canEdit) return;
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditTone(song.originalKey);
    setEditBpm(song.bpm || 70);
    setEditCategory(song.category || song.tag === 'MIO' ? '#MIO' : '#RAV');
    setEditBody(serializeSectionsToBody(song.sections));
    setEditError(null);
    setIsEditing(true);
    audioEngine.stopAll();
    setIsPlaying(false);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };
  const handleSaveEdit = () => {
    setEditError(null);
    if (!editTitle.trim()) { setEditError('Falta Título'); return; }
    if (!editBody.trim()) { setEditError('Falta cuerpo de la canción'); return; }
    // Determinar categoría permitida: ADMIN puede elegir cualquiera, resto solo #MIO o unidas
    let finalCat = editCategory;
    if (!isAdmin) {
      const allowed = new Set(['#MIO', ...(userCategories || []).map((c) => c.toUpperCase())]);
      if (!allowed.has(finalCat.toUpperCase())) finalCat = '#MIO';
    }
    finalCat = finalCat.toUpperCase().startsWith('#') ? finalCat.toUpperCase() : `#${finalCat.toUpperCase()}`;
    const sections = parseSpacedSongBody(editBody);
    if (sections.length === 0 || sections.every((s) => s.lines.length === 0)) {
      setEditError('Cuerpo vacío o sin letras'); return;
    }
    const updated: Song = {
      ...song,
      title: editTitle.trim(),
      artist: editArtist.trim() || 'Desconocido',
      originalKey: editTone.trim() || 'C',
      bpm: Number(editBpm) || 70,
      category: finalCat,
      tag: finalCat === '#MIO' ? 'MIO' : 'CONGRE',
      sections,
    };
    if (onUpdateSong) onUpdateSong(updated);
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Print - genera hoja A4 real en ventana nueva (no window.print de la app)
  const handlePrint = (withChords: boolean) => {
    setIsPrintModalOpen(false);
    // pequeño delay para que cierre el modal antes de abrir popup (evita bloqueador)
    setTimeout(() => {
      const transposedSectionsHtml = song.sections
        .map((sec) => {
          const titleHtml = sec.title
            ? `<div style="font-weight:700;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${sec.isChorus ? '#00305d' : '#6b7280'};margin:18px 0 8px 0;${sec.isChorus ? 'border-left:4px solid #00305d;padding-left:10px;background:#f2f4f6;border-radius:4px;padding-top:6px;padding-bottom:6px;' : ''}">${sec.title}</div>`
            : '';
          const linesHtml = sec.lines
            .map((line) => {
              const chordPro = line.chordPro || convertLegacyLineToChordPro(line.lyrics || '', line.chords);
              if (!withChords) {
                const plain = chordPro.replace(/\[[^\]]+\]/g, '');
                return `<div style="margin:4px 0;font-size:14px;line-height:1.6;color:#111827;">${plain || '&nbsp;'}</div>`;
              }
              const tokens = parseChordProToTokens(chordPro);
              // fila con acorde arriba (techo) - flex
              const row = tokens
                .map((word) =>
                  word.segments
                    .map((seg) => {
                      const chord = seg.chord ? transposeChordName(seg.chord, semitones, cipherSystem as CipherSystem) : '';
                      const chordSpan = chord
                        ? `<div style="font-size:10px;font-weight:700;color:#1A477A;font-family:monospace;line-height:1;min-height:12px;">${chord}</div>`
                        : `<div style="font-size:10px;line-height:1;min-height:12px;">&nbsp;</div>`;
                      return `<span style="display:inline-flex;flex-direction:column;align-items:flex-start;margin-right:1px;">${chordSpan}<span style="font-size:13px;line-height:1.2;color:#111827;">${seg.text}</span></span>`;
                    })
                    .join('')
                )
                .join('<span style="white-space:pre;"> </span>');
              return `<div style="display:flex;flex-wrap:wrap;align-items:flex-end;margin:6px 0 2px 0;">${row}</div>`;
            })
            .join('');
          return titleHtml + linesHtml;
        })
        .join('<div style="height:10px;"></div>');

      const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${song.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 14mm 13mm; }
          * { box-sizing:border-box; }
          body { font-family:'Montserrat',sans-serif; color:#111827; margin:0; padding:18mm 14mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          h1 { font-size:20px; color:#00305d; margin:0 0 2px 0; }
          .sub { font-size:11px; color:#6b7280; margin-bottom:14px; }
          .tag { display:inline-block; font-size:9px; font-weight:700; padding:2px 6px; border-radius:999px; background:${song.tag === 'CONGRE' ? '#6bfad9' : '#E2E8F0'}; color:${song.tag === 'CONGRE' ? '#00725f' : '#1A477A'}; margin-left:8px; vertical-align:middle; }
          @media print { body { padding:0; } }
        </style></head><body>
        <h1>${song.title}<span class="tag">${song.tag}</span></h1>
        <div class="sub">${song.artist} &nbsp;•&nbsp; Tono orig: ${song.originalKey} ${semitones !== 0 ? `→ ${transposeChordName(song.originalKey, semitones, cipherSystem as CipherSystem)}` : ''} &nbsp;•&nbsp; ${bpm} BPM</div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:10px 0 14px 0;">
        ${transposedSectionsHtml}
        <script>window.onload=function(){ setTimeout(function(){ window.focus(); window.print(); }, 250); }<\/script>
        </body></html>`;

      const win = window.open('', '_blank');
      if (!win) {
        // fallback: si bloquea popup, intenta imprimir en misma ventana vía iframe oculto
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) { doc.open(); doc.write(html); doc.close(); setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }, 400); }
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
    }, 80);
  };

  const currentDiagram = selectedChord ? CHORD_DIAGRAMS[selectedChord] : null;

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col font-sans transition-colors duration-300 relative border border-[#c3c6d1] shadow-sm">
      {/* Top AppBar */}
      <header className="bg-white sticky top-0 w-full px-4 sm:px-6 md:px-8 lg:px-12 h-14 sm:h-16 z-50 flex justify-between items-center border-b border-[#c3c6d1]/50 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="hover:bg-[#f2f4f6] p-2 rounded-full transition-all text-[#00305d] cursor-pointer flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
            title="Volver a la lista"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="font-semibold text-base sm:text-lg md:text-xl text-[#00305d] tracking-tight truncate max-w-[150px] sm:max-w-[220px] md:max-w-md lg:max-w-lg">
            {song.title}
          </h1>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-1 hidden sm:inline shrink-0 ${
              song.tag === 'CONGRE'
                ? 'bg-[#6bfad9] text-[#00725f]'
                : 'bg-[#E2E8F0] text-[#1A477A]'
            }`}
          >
            {song.tag}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="flex-shrink-0 bg-[#1A477A] text-white rounded-full p-2.5 w-11 h-11 flex items-center justify-center cursor-pointer hover:bg-[#00305d] transition-transform active:scale-95 shadow-sm"
              title="Menú Principal"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          )}
        </div>
      </header>

      {/* Accompaniment Bar */}
      <nav className="bg-white px-4 sm:px-6 md:px-8 lg:px-12 py-3 border-b border-[#c3c6d1]/50 flex flex-wrap items-center gap-3 sm:gap-4 sticky top-14 sm:top-16 z-40 shadow-xs justify-start">
        {/* Play Control */}
        <div className="flex items-center">
          <button
            onClick={handleTogglePlay}
            className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-md transition-all active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-[#00305d] ring-4 ring-[#3ED5B6]/30'
                : 'bg-[#00305d] hover:bg-[#1a477a]'
            }`}
            title={isPlaying ? 'Pausar acompañamiento' : 'Reproducir acompañamiento'}
          >
            <span className="material-symbols-outlined text-2xl">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>

        {/* BPM Selector */}
        <div className="flex items-center bg-[#f2f4f6] rounded-xl px-3 py-2 gap-2 border border-[#c3c6d1]/50">
          <span className="material-symbols-outlined text-[#43474f] text-lg">speed</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="bg-transparent border-none focus:outline-none w-12 p-0 text-center font-bold text-[#00305d]"
          />
          <span className="text-xs font-semibold text-[#43474f]">BPM</span>
        </div>

        {/* Instrument Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleDrum}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isDrumActive
                ? 'bg-[#6bfad9] border-[#006b59] text-[#00725f] shadow-2xs'
                : 'bg-white border-[#c3c6d1] text-[#43474f] hover:bg-[#f2f4f6]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">music_note</span>
            <span>Batería</span>
          </button>

          <button
            onClick={handleTogglePad}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isPadActive
                ? 'bg-[#6bfad9] border-[#006b59] text-[#00725f] shadow-2xs'
                : 'bg-white border-[#c3c6d1] text-[#43474f] hover:bg-[#f2f4f6]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">keyboard</span>
            <span>Pad</span>
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#c3c6d1] text-[#43474f] hover:bg-[#f2f4f6] hover:text-[#00305d] transition-colors cursor-pointer"
              title="Ajustes de acompañamiento"
            >
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
          )}
          {/* Editar canción - solo ADMIN (cancionerorav@gmail.com) */}
          {canEdit && onUpdateSong && (
            <div className="flex items-center gap-2 ml-1">
              <button
                onClick={() => isEditing ? handleCancelEdit() : handleEnterEdit()}
                className={`px-4 py-2 rounded-xl border text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${isEditing ? 'bg-white border-[#c3c6d1] text-[#43474f] hover:bg-[#f2f4f6]' : 'bg-white border-black text-black hover:bg-[#f2f4f6] shadow-xs'}`}
              >
                {isEditing ? 'cancelar' : 'editar cancion'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-xl bg-[#1A477A] text-white text-xs font-bold tracking-wide uppercase hover:bg-[#00305d] shadow-sm cursor-pointer"
                >
                  guardar cancion
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Song Content - scroll interno para no exceder viewport */}
      <main className="flex-1 min-h-0 overflow-y-auto max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-4 sm:pt-6 pb-20 md:pb-6 flex gap-4 md:gap-8 relative w-full">
        {isEditing ? (
          <div className="flex-grow max-w-3xl space-y-4 pr-0 md:pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#43474f] uppercase">Título *</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#43474f] uppercase">Grupo / Artista</label>
                <input value={editArtist} onChange={(e) => setEditArtist(e.target.value)} placeholder="Michael Bunster" className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#43474f] uppercase">Tono</label>
                <input value={editTone} onChange={(e) => setEditTone(e.target.value)} placeholder="D" className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#43474f] uppercase">BPM</label>
                <input type="number" value={editBpm} onChange={(e) => setEditBpm(Number(e.target.value))} className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-[#43474f] uppercase">Categoría</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] cursor-pointer">
                  {(isAdmin ? availableCategories : availableCategories.filter((c) => new Set(['#MIO', ...(userCategories || []).map((x) => x.toUpperCase())]).has(c.label.toUpperCase()))).map((c) => (
                    <option key={c.id} value={c.label}>{c.label} — {c.name}</option>
                  ))}
                  {(isAdmin ? availableCategories : []).length === 0 && <option value={editCategory}>{editCategory}</option>}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#43474f] uppercase">Letra + acordes (texto simple como archivo txt)</label>
              <p className="text-[11px] text-gray-500">Ej:  <span className="font-mono">D                Dsus4</span> en línea superior y letra debajo. Secciones: Intro, Estrofa, Coro…</p>
              <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder={`Intro: D - Dsus4 (x2)\nEstrofa\n   D                Dsus4\nHay una puerta abierta\n D                Dsus4\nMe dices que suba allá`} className="w-full h-[380px] sm:h-[440px] p-4 bg-white border-2 border-[#0ea5e9] rounded-xl text-sm font-mono leading-5 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 whitespace-pre overflow-auto" spellCheck={false} />
            </div>
            {editError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{editError}</div>}
            <div className="flex gap-2">
              <button onClick={handleCancelEdit} className="flex-1 py-3 bg-white border border-[#c3c6d1] text-[#43474f] rounded-xl font-bold text-sm hover:bg-[#f2f4f6] cursor-pointer">Cancelar</button>
              <button onClick={handleSaveEdit} className="flex-1 py-3 bg-[#1A477A] text-white rounded-xl font-bold text-sm hover:bg-[#00305d] cursor-pointer">Guardar cambios</button>
            </div>
          </div>
        ) : (
          <div className="flex-grow max-w-3xl transition-all duration-300 space-y-6 md:space-y-8 pr-0 md:pr-2">
            {song.sections.map((section, secIdx) => (
            <div
              key={secIdx}
              className={`${
                section.isChorus
                  ? 'p-6 bg-[#f2f4f6] rounded-xl border-l-4 border-[#00305d] shadow-2xs'
                  : ''
              }`}
            >
              {section.title && (
                <h3
                  className={`font-bold mb-6 text-xs tracking-wider uppercase ${
                    section.isChorus ? 'text-[#00305d]' : 'text-[#737780]'
                  }`}
                >
                  {section.title}
                </h3>
              )}

              <div className="space-y-6">
                {section.lines.map((line, lineIdx) => {
                  const chordPro =
                    line.chordPro ||
                    convertLegacyLineToChordPro(line.lyrics || '', line.chords);
                  const wordTokens = parseChordProToTokens(chordPro);

                  return (
                    <div
                      key={lineIdx}
                      className="flex flex-wrap items-end gap-y-3 leading-none my-2 transition-all"
                    >
                      {wordTokens.map((word, wIdx) => (
                        <span
                          key={wIdx}
                          className="inline-flex items-end mr-[0.35em] mb-1"
                        >
                          {word.segments.map((seg, sIdx) => {
                            const hasChord = !!seg.chord;
                            const transposed = hasChord
                              ? transposeChordName(
                                  seg.chord!,
                                  semitones,
                                  cipherSystem as CipherSystem
                                )
                              : null;

                            return (
                              <span
                                key={sIdx}
                                className="inline-flex flex-col items-start justify-end"
                              >
                                {/* Chord Roof ("Techo") */}
                                <span
                                  style={{
                                    fontSize: `${Math.max(12, Math.round(fontSize * 0.72))}px`,
                                    lineHeight: '1.1',
                                    minHeight: `${Math.max(16, Math.round(fontSize * 0.85))}px`,
                                  }}
                                  onClick={(e) => {
                                    if (seg.chord) {
                                      handleChordClick(seg.chord, e);
                                    }
                                  }}
                                  className={`font-bold font-mono tracking-tight select-none mb-1 transition-all ${
                                    hasChord
                                      ? 'text-[#1A477A] hover:text-[#00725f] hover:underline cursor-pointer'
                                      : 'opacity-0 pointer-events-none'
                                  }`}
                                >
                                  {transposed || '\u00A0'}
                                </span>

                                {/* Lyrics Syllable / Text */}
                                <span
                                  style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: '1.2',
                                  }}
                                  className="font-medium text-[#191c1e] whitespace-pre tracking-normal select-text"
                                >
                                  {seg.text}
                                </span>
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
        )}
        {/* Responsive Sidebar: horizontal bottom bar en móvil/tablet chica, vertical flotante en md+ */}
        {/* Mobile/Tablet horizontal bar */}
        <aside className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <div className="floating-sidebar bg-white border border-[#c3c6d1] rounded-2xl px-2 py-2 flex flex-row gap-1 items-center shadow-xl pointer-events-auto overflow-x-auto max-w-[98vw]">
            <button onClick={() => handleTranspose(-1)} className="min-w-[40px] h-9 flex items-center justify-center rounded-xl hover:bg-[#f2f4f6] text-[#00305d] font-bold text-[13px] cursor-pointer shrink-0">- ♪</button>
            <button onClick={handleResetTranspose} className="min-w-[44px] h-9 flex items-center justify-center rounded-xl hover:bg-[#f2f4f6] text-[#43474f] font-semibold text-[11px] cursor-pointer shrink-0">Orig.</button>
            <button onClick={() => handleTranspose(1)} className="min-w-[40px] h-9 flex items-center justify-center rounded-xl hover:bg-[#f2f4f6] text-[#00305d] font-bold text-[13px] cursor-pointer shrink-0">+ ♪</button>
            <div className="w-px h-6 bg-[#c3c6d1] mx-1 shrink-0" />
            <button onClick={() => handleChangeFontSize(2)} className="min-w-[40px] h-9 flex items-center justify-center rounded-xl hover:bg-[#f2f4f6] text-[#00305d] font-bold text-[13px] cursor-pointer shrink-0">A+</button>
            <button onClick={() => handleChangeFontSize(-2)} className="min-w-[40px] h-9 flex items-center justify-center rounded-xl hover:bg-[#f2f4f6] text-[#43474f] font-semibold text-[13px] cursor-pointer shrink-0">A-</button>
            <div className="w-px h-6 bg-[#c3c6d1] mx-1 shrink-0" />
            <button onClick={handleTogglePlay} className={`min-w-[40px] h-9 flex items-center justify-center rounded-xl cursor-pointer shrink-0 ${isPlaying ? 'bg-[#00305d] text-white' : 'hover:bg-[#f2f4f6] text-[#00305d]'}`}><span className="material-symbols-outlined text-[18px]">{isPlaying ? 'pause' : 'play_arrow'}</span></button>
            <button onClick={handleToggleAutoScroll} className={`min-w-[40px] h-9 flex items-center justify-center rounded-xl cursor-pointer shrink-0 ${isAutoScrolling ? 'bg-[#3ED5B6] text-white' : 'hover:bg-[#f2f4f6] text-[#43474f]'}`}><span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_down</span></button>
            <button onClick={handleToggleFullScreen} className="min-w-[40px] h-9 flex items-center justify-center rounded-xl hover:bg-[#f2f4f6] text-[#43474f] cursor-pointer shrink-0"><span className="material-symbols-outlined text-[18px]">fullscreen</span></button>
            <button onClick={() => setIsPrintModalOpen(true)} className="min-w-[40px] h-9 flex items-center justify-center rounded-xl hover:bg-[#f2f4f6] text-[#43474f] cursor-pointer shrink-0"><span className="material-symbols-outlined text-[18px]">print</span></button>
          </div>
        </aside>
        {/* Desktop vertical bar */}
        <aside className="hidden md:flex fixed right-2 lg:right-4 top-1/2 -translate-y-1/2 z-50">
          <div className="floating-sidebar bg-white border border-[#c3c6d1] rounded-xl p-1 flex flex-col gap-0.5 items-center shadow-lg w-[44px]">
            <button
              onClick={() => handleTranspose(-1)}
              className="w-[40px] h-[32px] flex items-center justify-center rounded-lg hover:bg-[#f2f4f6] transition-colors text-[#00305d] font-bold text-[13px] cursor-pointer leading-none"
              title="Transportar -1 tono"
            >
              - ♪
            </button>
            <button
              onClick={handleResetTranspose}
              className="w-[40px] h-[26px] flex items-center justify-center rounded-lg hover:bg-[#f2f4f6] transition-colors text-[#43474f] font-semibold text-[11px] cursor-pointer leading-none tracking-tight"
              title="Tono Original"
            >
              Orig.
            </button>
            <button
              onClick={() => handleTranspose(1)}
              className="w-[40px] h-[32px] flex items-center justify-center rounded-lg hover:bg-[#f2f4f6] transition-colors text-[#00305d] font-bold text-[13px] cursor-pointer leading-none"
              title="Transportar +1 tono"
            >
              + ♪
            </button>

            <div className="w-6 h-px bg-[#c3c6d1] my-1" />

            <button
              onClick={() => handleChangeFontSize(2)}
              className="w-[36px] h-[34px] flex items-center justify-center rounded-lg hover:bg-[#f2f4f6] transition-colors text-[#00305d] font-bold text-[13px] cursor-pointer"
              title="Aumentar letra"
            >
              A+
            </button>
            <button
              onClick={() => handleChangeFontSize(-2)}
              className="w-[36px] h-[34px] flex items-center justify-center rounded-lg hover:bg-[#f2f4f6] transition-colors text-[#43474f] font-semibold text-[13px] cursor-pointer"
              title="Disminuir letra"
            >
              A-
            </button>

            <div className="w-6 h-px bg-[#c3c6d1] my-1" />

            <button
              onClick={handleToggleFullScreen}
              className="w-[36px] h-[34px] flex items-center justify-center rounded-lg hover:bg-[#f2f4f6] transition-colors text-[#43474f] cursor-pointer"
              title="Pantalla completa"
            >
              <span className="material-symbols-outlined text-[18px]">fullscreen</span>
            </button>

            <button
              onClick={handleTogglePlay}
              className={`w-[36px] h-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-[#00305d] text-white'
                  : 'hover:bg-[#f2f4f6] text-[#00305d]'
              }`}
              title="Reproducir/Pausar"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Auto-scroll button with hover speeds - con puente invisible para no perder hover */}
            <div
              className="relative"
              onMouseEnter={() => setShowSpeedMenu(true)}
              onMouseLeave={() => setShowSpeedMenu(false)}
            >
              <button
                onClick={handleToggleAutoScroll}
                className={`w-[36px] h-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isAutoScrolling
                    ? 'bg-[#3ED5B6] text-white animate-pulse'
                    : 'hover:bg-[#f2f4f6] text-[#43474f]'
                }`}
                title="Desplazamiento automático"
              >
                <span className="material-symbols-outlined text-[18px]">
                  keyboard_double_arrow_down
                </span>
              </button>
              {/* puente invisible que cubre el gap de 8px para que el mouse no dispare mouseLeave */}
              {showSpeedMenu && <div className="absolute right-full top-0 w-2 h-full" aria-hidden />}

              {showSpeedMenu && (
                <div
                  className="absolute right-full mr-2 top-0 bg-white border border-[#c3c6d1] rounded-xl flex flex-col p-1 shadow-xl z-50 min-w-[70px]"
                  onMouseEnter={() => setShowSpeedMenu(true)}
                  onMouseLeave={() => setShowSpeedMenu(false)}
                >
                  {[0.25, 0.5, 1, 1.5, 2, 3, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        setScrollSpeed(spd);
                        if (!isAutoScrolling) handleToggleAutoScroll();
                        setShowSpeedMenu(false);
                      }}
                      className={`px-3 py-1 hover:bg-[#f2f4f6] rounded-lg text-xs font-bold text-center ${
                        scrollSpeed === spd ? 'text-[#00305d] bg-[#d4e3ff]' : 'text-gray-700'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="w-[36px] h-[34px] flex items-center justify-center rounded-lg hover:bg-[#f2f4f6] transition-colors text-[#43474f] cursor-pointer"
              title="Imprimir canción"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
            </button>
          </div>
        </aside>
      </main>

      {/* Chord Popover */}
      {selectedChord && popoverPos && (
        <div
          className="fixed z-[60] bg-white border border-[#c3c6d1] shadow-2xl rounded-2xl p-4 w-52 transform -translate-x-1/2 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150"
          style={{ top: `${popoverPos.y}px`, left: `${popoverPos.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <button className="material-symbols-outlined text-[#737780] hover:text-[#00305d]">
              chevron_left
            </button>
            <span className="font-bold text-[#00305d] text-lg">
              {transposeChordName(selectedChord || '', semitones, cipherSystem as CipherSystem)}
            </span>
            <button className="material-symbols-outlined text-[#737780] hover:text-[#00305d]">
              chevron_right
            </button>
          </div>

          {/* Guitar Fretboard Diagram */}
          <div className="aspect-[3/4] bg-[#f2f4f6] rounded-lg relative overflow-hidden flex flex-col p-3 border border-[#c3c6d1]/40">
            {/* Frets */}
            <div className="flex flex-col gap-3.5 flex-grow">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-0.5 bg-[#43474f]/30 rounded-full w-full" />
              ))}
            </div>

            {/* Finger position dots simulation */}
            <div className="absolute top-[12%] left-[18%] w-3.5 h-3.5 rounded-full bg-[#00305d] ring-2 ring-white shadow-xs" />
            <div className="absolute top-[38%] left-[80%] w-3.5 h-3.5 rounded-full bg-[#00305d] ring-2 ring-white shadow-xs" />
            <div className="absolute top-[75%] left-[48%] w-3.5 h-3.5 rounded-full bg-[#00305d] ring-2 ring-white shadow-xs" />
          </div>

          <div className="mt-3 text-center">
            <button
              onClick={() => setSelectedChord(null)}
              className="text-xs text-[#737780] hover:text-[#ba1a1a] uppercase font-bold tracking-widest cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Toast Guardado */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A477A] text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          Guardado
        </div>
      )}

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-transform relative mx-auto">
            <h2 className="text-2xl font-bold text-[#00305d] mb-6 text-center">
              Imprimir Canción
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handlePrint(true)}
                className="w-full py-4 px-6 bg-[#1a477a] text-white rounded-2xl font-semibold flex items-center justify-between hover:bg-[#00305d] transition-all shadow-sm cursor-pointer"
              >
                <span>CON ACORDES</span>
                <span className="material-symbols-outlined">description</span>
              </button>
              <button
                onClick={() => handlePrint(false)}
                className="w-full py-4 px-6 bg-[#1a477a] text-white rounded-2xl font-semibold flex items-center justify-between hover:bg-[#00305d] transition-all shadow-sm cursor-pointer"
              >
                <span>SIN ACORDES</span>
                <span className="material-symbols-outlined">notes</span>
              </button>
            </div>
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="mt-6 w-full text-center text-[#737780] font-medium hover:text-[#00305d] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
