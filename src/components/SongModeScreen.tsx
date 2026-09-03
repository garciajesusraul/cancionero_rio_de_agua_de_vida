import React, { useState, useEffect, useRef } from 'react';
import { Song, CipherSystem } from '../types';
import { CHORD_DIAGRAMS, transposeChordName } from '../data/chords';
import { audioEngine } from '../utils/AudioEngine';
import { parseChordProToTokens, convertLegacyLineToChordPro } from '../utils/chordParser';

interface SongModeScreenProps {
  song: Song;
  onBack: () => void;
  onOpenMenu?: () => void;
  onOpenSettings?: () => void;
  cipherSystem?: CipherSystem;
}

export const SongModeScreen: React.FC<SongModeScreenProps> = ({
  song,
  onBack,
  onOpenMenu,
  onOpenSettings,
  cipherSystem = 'American',
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
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col font-sans transition-colors duration-300 relative border border-[#c3c6d1] shadow-sm">
      {/* Top AppBar */}
      <header className="bg-white sticky top-0 w-full px-4 md:px-12 h-16 z-50 flex justify-between items-center border-b border-[#c3c6d1]/50 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="hover:bg-[#f2f4f6] p-2 rounded-full transition-all text-[#00305d] cursor-pointer flex items-center justify-center"
            title="Volver a la lista"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="font-semibold text-lg sm:text-xl text-[#00305d] tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {song.title}
          </h1>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-1 hidden xs:inline ${
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
      <nav className="bg-white px-4 md:px-12 py-3 border-b border-[#c3c6d1]/50 flex flex-wrap items-center gap-4 sticky top-16 z-40 shadow-xs justify-start">
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
        </div>
      </nav>

      {/* Main Song Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-12 pt-10 pb-32 flex gap-8 relative min-h-screen w-full">
        {/* Song Lyrics Area */}
        <div className="flex-grow max-w-3xl transition-all duration-300 space-y-10">
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

        {/* Floating Right Vertical Sidebar - optimizada: barra -30% pero transposición legible */}
        <aside className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-50">
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
