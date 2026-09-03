export interface ChordSegment {
  chord?: string;
  text: string;
}

export interface WordToken {
  segments: ChordSegment[];
  trailingSpace?: boolean;
}

/**
 * Parses a ChordPro formatted line into WordTokens.
 * Each WordToken contains one or more segments (e.g. "glo" + "[D]ria" form the word "gloria").
 * This guarantees chords are pinned strictly above ("techo") their exact character/syllable,
 * while allowing words to wrap naturally when zooming in or on smaller screens.
 */
export function parseChordProToTokens(chordProText: string): WordToken[] {
  if (!chordProText) return [];

  // Match chord tokens [Chord] and text
  const regex = /\[([^\]]+)\]|([^\[]+)/g;
  const rawSegments: ChordSegment[] = [];
  let match;
  let currentChord: string | undefined = undefined;

  while ((match = regex.exec(chordProText)) !== null) {
    if (match[1] !== undefined) {
      // It's a chord [X]
      currentChord = match[1];
    } else if (match[2] !== undefined) {
      // It's lyrics text
      rawSegments.push({
        chord: currentChord,
        text: match[2],
      });
      currentChord = undefined;
    }
  }

  // If there was a trailing chord with no text (e.g. end of line chord [G])
  if (currentChord !== undefined) {
    rawSegments.push({
      chord: currentChord,
      text: ' ',
    });
  }

  // Now break rawSegments into words so layout wraps cleanly at word boundaries
  const words: WordToken[] = [];
  let currentWordSegments: ChordSegment[] = [];

  for (const seg of rawSegments) {
    const text = seg.text;
    const parts = text.split(/(\s+)/); // keep spaces

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const isSpace = /^\s+$/.test(part);

      if (isSpace) {
        // Trailing space terminates the current word
        if (currentWordSegments.length > 0) {
          words.push({
            segments: currentWordSegments,
            trailingSpace: true,
          });
          currentWordSegments = [];
        } else if (words.length > 0) {
          words[words.length - 1].trailingSpace = true;
        }
      } else {
        // Non-space text fragment
        // If this is the first part in the segment, attach the segment's chord
        const chordForPart = (i === 0 || (i === 1 && parts[0] === '')) ? seg.chord : undefined;
        currentWordSegments.push({
          chord: chordForPart,
          text: part,
        });
      }
    }
  }

  if (currentWordSegments.length > 0) {
    words.push({
      segments: currentWordSegments,
      trailingSpace: false,
    });
  }

  return words;
}

/**
 * Fallback converter for legacy lines with `lyrics` and `chords: { position, chord }[]`
 */
export function convertLegacyLineToChordPro(lyrics: string, chords?: { position?: string; charIndex?: number; chord: string }[]): string {
  if (!chords || chords.length === 0) return lyrics;
  if (!lyrics) return chords.map(c => `[${c.chord}]`).join(' ');

  // Sort chords by position or charIndex
  const chordPositions: { index: number; chord: string }[] = [];

  for (const ch of chords) {
    if (typeof ch.charIndex === 'number') {
      chordPositions.push({ index: Math.max(0, Math.min(lyrics.length, ch.charIndex)), chord: ch.chord });
    } else if (ch.position) {
      // Parse position e.g. 'left-0', 'left-[38%]', 'left-[40%]'
      const match = ch.position.match(/left-\[(\d+)%\]/);
      if (match) {
        const percent = parseInt(match[1], 10);
        const approxIndex = Math.round((percent / 100) * lyrics.length);
        chordPositions.push({ index: Math.max(0, Math.min(lyrics.length, approxIndex)), chord: ch.chord });
      } else if (ch.position.includes('left-0')) {
        chordPositions.push({ index: 0, chord: ch.chord });
      } else {
        chordPositions.push({ index: 0, chord: ch.chord });
      }
    }
  }

  chordPositions.sort((a, b) => a.index - b.index);

  let result = '';
  let lastIndex = 0;

  for (const cp of chordPositions) {
    const safeIdx = Math.max(lastIndex, Math.min(lyrics.length, cp.index));
    result += lyrics.slice(lastIndex, safeIdx);
    result += `[${cp.chord}]`;
    lastIndex = safeIdx;
  }

  result += lyrics.slice(lastIndex);
  return result;
}
