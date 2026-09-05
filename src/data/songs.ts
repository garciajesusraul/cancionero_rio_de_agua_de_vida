import { Song } from '../types';

// Vacío para carga limpia #RAV - sin canciones predefinidas, sin favoritos, sin playlists
// La base real se carga vía Supabase + localStorage (LoadSongsScreen)
export const INITIAL_SONGS: Song[] = [];
