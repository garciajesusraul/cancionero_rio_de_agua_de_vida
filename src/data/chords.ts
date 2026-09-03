import { CipherSystem } from '../types';

export interface ChordDiagram {
  name: string;
  frets: number[]; // 6 strings: e.g. [3, 2, 0, 0, 0, 3] for G
  fingers: (number | null)[]; // finger numbers: 1, 2, 3, 4
  barre?: number;
  latinoName: string;
}

export const CHORD_DIAGRAMS: Record<string, ChordDiagram> = {
  'G': {
    name: 'G',
    latinoName: 'Sol',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, null, null, null, 3]
  },
  'C': {
    name: 'C',
    latinoName: 'Do',
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null]
  },
  'D': {
    name: 'D',
    latinoName: 'Re',
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2]
  },
  'Am': {
    name: 'Am',
    latinoName: 'Lam',
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [null, null, 2, 3, 1, null]
  },
  'Em': {
    name: 'Em',
    latinoName: 'Mim',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [null, 2, 3, null, null, null]
  },
  'F': {
    name: 'F',
    latinoName: 'Fa',
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: 1
  },
  'Bm': {
    name: 'Bm',
    latinoName: 'Sim',
    frets: [-1, 2, 4, 4, 3, 2],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: 2
  },
  'A': {
    name: 'A',
    latinoName: 'La',
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null]
  },
  'E': {
    name: 'E',
    latinoName: 'Mi',
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [null, 2, 3, 1, null, null]
  }
};

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const AMERICAN_TO_LATINO: Record<string, string> = {
  'C': 'Do', 'C#': 'Do#', 'Db': 'Reb',
  'D': 'Re', 'D#': 'Re#', 'Eb': 'Mib',
  'E': 'Mi',
  'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Solb',
  'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Lab',
  'A': 'La', 'A#': 'La#', 'Bb': 'Sib',
  'B': 'Si'
};

export function transposeChordName(chord: string, semitones: number, cipher: CipherSystem = 'American'): string {
  if (!chord) return '';
  
  // Separate root chord from quality (e.g., Am -> root: A, suffix: m)
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];

  let index = CHROMATIC_SCALE.indexOf(root);
  if (index === -1) {
    // try standardizing b to # if needed
    if (root === 'Db') index = 1;
    else if (root === 'Eb') index = 3;
    else if (root === 'Gb') index = 6;
    else if (root === 'Ab') index = 8;
    else if (root === 'Bb') index = 10;
  }

  if (index === -1) return chord;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  const newRoot = CHROMATIC_SCALE[newIndex];

  if (cipher === 'Latino') {
    const latinoRoot = AMERICAN_TO_LATINO[newRoot] || newRoot;
    return latinoRoot + suffix;
  }

  return newRoot + suffix;
}
