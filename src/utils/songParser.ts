import { Song, SongSection, SongLine } from '../types';

// Convierte una línea de acordes espaciada + línea de letra en chordPro
// ej: chordLine="Bm               G                   D" , lyric="Quién se comparará, señor a tu hermosura" => "[Bm]Quién se compa[G]rará, señor a tu h[D]ermosura"
function spacedToChordPro(chordLine: string, lyricLine: string): string {
  if (!chordLine.trim()) return lyricLine;
  if (!lyricLine) {
    // solo acordes sin letra (intro/solo)
    const chords = [...chordLine.matchAll(/\S+/g)].map(m => `[${m[0]}]`).join(' ');
    return chords + (lyricLine ? ' ' + lyricLine : ' ');
  }
  // encontrar acordes y su índice de columna
  const matches = [...chordLine.matchAll(/\S+/g)];
  // ordenar de derecha a izquierda para insertar sin desplazar índices
  const sorted = [...matches].sort((a, b) => (b.index ?? 0) - (a.index ?? 0));
  let result = lyricLine;
  for (const m of sorted) {
    const chord = m[0];
    const col = m.index ?? 0;
    // si la columna está más allá de la letra, agregar espacios + acorde al final
    if (col >= result.length) {
      result = result + ' '.repeat(col - result.length) + `[${chord}]`;
    } else {
      result = result.slice(0, col) + `[${chord}]` + result.slice(col);
    }
  }
  return result;
}

// Detecta si una línea parece línea de acordes (solo acordes y espacios)
function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // si contiene solo notas/acordes y no letras de palabras largas, considerar acorde
  // patrón: tokens como G, Em, Bm, F#m, D/A, Asus4, etc con espacios
  const tokens = trimmed.split(/\s+/);
  // al menos 1 token y todos parecen acordes (empiezan con A-G)
  const chordRegex = /^[A-G][#b]?m?(?:maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][#b]?)?$/i;
  // permitir x2, X3 etc como repetición
  return tokens.every(t => chordRegex.test(t) || /^[xX]\d+$/.test(t));
}

export function parseSpacedSongBody(body: string): SongSection[] {
  const lines = body.split(/\r?\n/);
  const sections: SongSection[] = [];
  let current: SongSection = { lines: [] };
  let pendingChordLine: string | null = null;

  const sectionHeaderRegex = /^(VERSO|PRE-?CORO|CORO|PUENTE|INTRO|SOLO|ESTRIBILLO|VERSE|CHORUS|BRIDGE|OUTRO)(\s*\d*)?$/i;

  function flushChordLineAsSolo() {
    if (pendingChordLine !== null) {
      const chordPro = [...pendingChordLine.matchAll(/\S+/g)].map(m => `[${m[0]}]`).join(' ');
      current.lines.push({ chordPro: chordPro + ' ' });
      pendingChordLine = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      // línea vacía: volcar chord pendiente si existe y agregar línea vacía para separación
      if (pendingChordLine !== null) {
        flushChordLineAsSolo();
      } else {
        // línea vacía explícita para separar? no hace falta
      }
      continue;
    }

    if (sectionHeaderRegex.test(trimmed)) {
      // nueva sección
      flushChordLineAsSolo();
      if (current.lines.length > 0 || current.title) {
        sections.push(current);
      }
      const isChorus = /CORO|CHORUS|ESTRIBILLO/i.test(trimmed);
      current = { title: trimmed.toUpperCase(), isChorus, lines: [] };
      continue;
    }

    // si es línea de acordes, guardar pendiente
    if (isChordLine(raw)) {
      // si había una pendiente previa sin letra correspondiente, volcarla
      if (pendingChordLine !== null) {
        flushChordLineAsSolo();
      }
      pendingChordLine = raw;
      continue;
    }

    // es línea de letra: combinar con pendingChordLine si existe
    if (pendingChordLine !== null) {
      const chordPro = spacedToChordPro(pendingChordLine, raw);
      current.lines.push({ chordPro });
      pendingChordLine = null;
    } else {
      // letra sin acordes
      current.lines.push({ chordPro: raw });
    }
  }

  flushChordLineAsSolo();
  if (current.lines.length > 0 || current.title) sections.push(current);
  // si no hubo sección, devolver una por defecto
  if (sections.length === 0 && lines.some(l => l.trim())) {
    return [{ lines: lines.filter(l => l.trim()).map(l => ({ chordPro: l })) }];
  }
  return sections;
}

export interface ParsedSongInput {
  title: string;
  artist: string;
  key?: string;
  bpm?: number;
  category?: string;
  body: string;
}

export function parseHeaderAndBody(raw: string, fallbackCategory = '#MIO'): { song: Song; error?: string } | { error: string } {
  const lines = raw.split(/\r?\n/);
  let title = '';
  let artist = '';
  let key = 'C';
  let bpm = 70;
  let category = fallbackCategory;
  let bodyStartIdx = 0;

  // detectar encabezado: líneas con = o primera línea como título
  let headerEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (l.startsWith('---')) break; // separador improbable dentro header
    const lower = l.toLowerCase();
    if (lower.startsWith('titulo=') || lower.startsWith('título=')) { title = l.split('=').slice(1).join('=').trim(); headerEnd = i; continue; }
    if (lower.startsWith('grupo=') || lower.startsWith('banda=') || lower.startsWith('artista=')) { artist = l.split('=').slice(1).join('=').trim(); headerEnd = i; continue; }
    if (lower.startsWith('tono=') || lower.startsWith('tono original=') || lower.startsWith('key=')) { key = l.split('=').slice(1).join('=').trim() || 'C'; headerEnd = i; continue; }
    if (lower.startsWith('bpm=')) { const v = parseInt(l.split('=').slice(1).join('=').trim(), 10); if (!isNaN(v)) bpm = v; headerEnd = i; continue; }
    if (lower.startsWith('categoria=') || lower.startsWith('categoría=')) { const c = l.split('=').slice(1).join('=').trim(); if (c) category = c.startsWith('#') ? c.toUpperCase() : `#${c.toUpperCase()}`; headerEnd = i; continue; }
    // si es línea de sección o acordes/letras, fin de header
    if (/^(VERSO|CORO|PRE|PUENTE|INTRO|SOLO)/i.test(l) || isChordLine(l)) break;
    // si no es header y aún no hay título, tomar primera línea no vacía como título
    if (!title && l && !l.includes('=')) {
      // solo si no hemos detectado header previo y parece título corto
      if (i < 3) { title = l.trim(); headerEnd = i; continue; }
      break;
    }
    break;
  }

  // si no se detectó título vía =, buscar primera línea no vacía que no sea header conocido
  if (!title) {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l || l.startsWith('---')) continue;
      if (l.includes('=')) continue;
      if (/^(VERSO|CORO|PRE|PUENTE|INTRO|SOLO)/i.test(l)) continue;
      if (isChordLine(l)) continue;
      title = l;
      headerEnd = i;
      break;
    }
  }

  if (!title) return { error: 'Falta título (Titulo= o primera línea)' };
  if (!artist) artist = 'Desconocido';

  bodyStartIdx = headerEnd + 1;
  const body = lines.slice(bodyStartIdx).join('\n').trim();
  if (!body) return { error: `Canción "${title}" sin cuerpo (letras/acordes)` };

  const sections = parseSpacedSongBody(body);
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);

  const tag: Song['tag'] = category.toUpperCase() === '#MIO' ? 'MIO' : 'CONGRE';

  const song: Song = {
    id,
    title: title.trim(),
    artist: artist.trim(),
    tag,
    category: category.toUpperCase(),
    bpm: bpm || 70,
    originalKey: key || 'C',
    sections,
    createdAt: Date.now(),
  };

  return { song };
}

export function splitBulkFile(content: string): string[] {
  // separador: una línea con al menos 10 guiones (no es exacta, es larga)
  return content.split(/-{10,}/).map(s => s.trim()).filter(Boolean);
}
