export type ScreenView = 'search' | 'song' | 'setup' | 'settings' | 'login' | 'playlist' | 'allSongs' | 'favorites' | 'bible' | 'loadSongs' | 'admin';

export type CipherSystem = 'American' | 'Latino';

export interface SongLine {
  lyrics?: string;
  chordPro?: string;
  chords?: { position?: string; charIndex?: number; chord: string }[];
}

export interface SongSection {
  title?: string; // e.g. "CORO", "VERSO 1", "PUENTE"
  isChorus?: boolean;
  lines: SongLine[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  tag: 'CONGRE' | 'MIO';
  category?: string; // e.g. #MIO, #RAV, #IGLESIADELCENTRO
  bpm: number;
  originalKey: string;
  currentKey?: string;
  sections: SongSection[];
  isFavorite?: boolean;
  favoriteAt?: number;
  createdAt?: number;
}

export interface Category {
  id: string; // e.g. rav, mio, iglesiadelcentro
  label: string; // e.g. #RAV
  name: string; // e.g. RIOS DE AGUA DE VIDA
  createdAt: number;
}

export interface InstrumentOption {
  id: string;
  name: string;
  icon: string;
}

export interface UserProfile {
  name: string;
  email: string;
  memberSince: string;
  photoUrl?: string;
  congregationCodes: string[];
  tempCode: string;
  mainInstrument: string;
  otherInstruments: string[];
  cipherSystem: CipherSystem;
  defaultBpm: number;
  padStyle: string;
  drumStyle: string;
  savePerSong: boolean;
  darkMode: boolean;
  fontSize: number; // in px, e.g. 18
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BibleInfo {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
}

export interface BibleBook {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
}

export interface BibleChapterRef {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  reference: string;
}

export interface BibleChapterContent {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
  content: string; // HTML from api.bible
  verseCount: number;
  copyright: string;
}
