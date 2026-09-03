export type ScreenView = 'search' | 'song' | 'setup' | 'settings' | 'login' | 'playlist' | 'allSongs' | 'favorites';

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
  bpm: number;
  originalKey: string;
  currentKey?: string;
  sections: SongSection[];
  isFavorite?: boolean;
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
