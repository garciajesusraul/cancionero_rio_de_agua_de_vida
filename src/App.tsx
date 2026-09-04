import React, { useState, useEffect } from 'react';
import { ScreenView, Song, UserProfile, Playlist } from './types';
import { INITIAL_SONGS } from './data/songs';
import { NavigationDrawer } from './components/NavigationDrawer';
import { SearchSongsScreen } from './components/SearchSongsScreen';
import { SongModeScreen } from './components/SongModeScreen';
import { InitialSetupScreen } from './components/InitialSetupScreen';
import { UserSettingsScreen } from './components/UserSettingsScreen';
import { LoginScreen } from './components/LoginScreen';
import { PlaylistScreen } from './components/PlaylistScreen';
import { BibleScreen } from './components/BibleScreen';
import { AllSongsScreen } from './components/AllSongsScreen';
import { FavoritesScreen } from './components/FavoritesScreen';
import { LoadSongsScreen } from './components/LoadSongsScreen';
import { AdminPanel } from './components/AdminPanel';
import { Category } from './types';

const PLAYLISTS_KEY = 'rav_playlists_v2';
const SELECTED_KEY = 'rav_selected_playlist';
const SONGS_KEY = 'rav_songs_v2';
const CATEGORIES_KEY = 'rav_categories_v2';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const raw = localStorage.getItem(SONGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Song[];
        // merge con INITIAL_SONGS para no perder base: si hay ids nuevos mantenerlos
        const ids = new Set(parsed.map((s) => s.id));
        return [...parsed, ...INITIAL_SONGS.filter((s) => !ids.has(s.id))];
      }
    } catch {}
    return INITIAL_SONGS;
  });
  const [selectedSong, setSelectedSong] = useState<Song>(INITIAL_SONGS[0]);
  const [previousScreen, setPreviousScreen] = useState<ScreenView>('search');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminLoadCategory, setAdminLoadCategory] = useState('#RAV');
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const raw = localStorage.getItem(CATEGORIES_KEY);
      if (raw) return JSON.parse(raw) as Category[];
    } catch {}
    return [
      { id: 'mio', label: '#MIO', name: 'Mis canciones', createdAt: Date.now() - 100000 },
      { id: 'rav', label: '#RAV', name: 'RIOS DE AGUA DE VIDA', createdAt: Date.now() - 50000 },
    ];
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Elala Bador',
    email: 'elala.bador@ejemplo.com',
    memberSince: 'Miembro desde 2023',
    congregationCodes: ['#RAV', '#LR'],
    tempCode: '',
    mainInstrument: 'Voz',
    otherInstruments: ['Guitarra', 'Piano', 'Batería'],
    cipherSystem: 'American',
    defaultBpm: 70,
    padStyle: 'Bright Shimmer',
    drumStyle: 'Modern Worship',
    savePerSong: true,
    darkMode: false,
    fontSize: 18,
  });

  // Playlists con persistencia localStorage (preparado para Supabase)
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const raw = localStorage.getItem(PLAYLISTS_KEY);
      if (raw) return JSON.parse(raw) as Playlist[];
    } catch {}
    return [];
  });
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SELECTED_KEY);
    } catch { return null; }
  });

  useEffect(() => {
    try { localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists)); } catch {}
  }, [playlists]);
  useEffect(() => {
    try {
      if (selectedPlaylistId) localStorage.setItem(SELECTED_KEY, selectedPlaylistId);
      else localStorage.removeItem(SELECTED_KEY);
    } catch {}
  }, [selectedPlaylistId]);
  useEffect(() => { try { localStorage.setItem(SONGS_KEY, JSON.stringify(songs)); } catch {} }, [songs]);
  useEffect(() => { try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)); } catch {} }, [categories]);

  const handleToggleFavorite = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSongs((prev) => prev.map((s) => {
      if (s.id !== songId) return s;
      const willBeFav = !s.isFavorite;
      return { ...s, isFavorite: willBeFav, favoriteAt: willBeFav ? Date.now() : undefined };
    }));
  };

  const handleSelectSong = (song: Song) => {
    setPreviousScreen(currentScreen);
    setSelectedSong(song);
    setCurrentScreen('song');
  };

  const handleSetupComplete = (instrument: string, code: string) => {
    const idMap: Record<string, string> = {
      voz: 'Voz', guitarra: 'Guitarra', piano: 'Piano', ukelele: 'Ukelele',
      bateria: 'Batería', bajo: 'Bajo', cajon: 'Cajón', pandereta: 'Pandereta',
      saxofon: 'Saxofón', violin: 'Violín', otro: 'Otro', ninguno: 'Ninguno',
    };
    const principalLabel = idMap[instrument] || instrument;
    setUserProfile((prev) => ({
      ...prev,
      mainInstrument: principalLabel,
      congregationCodes: code ? Array.from(new Set([...prev.congregationCodes, code])) : prev.congregationCodes,
    }));
    setCurrentScreen('search');
  };

  const handleNavigate = (screen: ScreenView) => {
    if (screen === 'song') return;
    setCurrentScreen(screen);
  };

  const handleSaveSettings = (updated: UserProfile) => setUserProfile(updated);

  const handleAdminLogin = (password: string) => {
    if (password === 'elala_bador_2026') { setIsAdmin(true); setShowAdminPanel(true); return true; }
    return false;
  };

  const handleCreateCategory = (label: string, name: string) => {
    const id = label.replace('#', '').toLowerCase();
    setCategories((prev) => [...prev, { id, label, name, createdAt: Date.now() }]);
  };
  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveSong = (song: Song) => {
    // respetar límite: si no es admin, forzar #MIO
    const cat = isAdmin ? song.category || adminLoadCategory : '#MIO';
    const final: Song = { ...song, category: cat, tag: cat === '#MIO' ? 'MIO' : 'CONGRE' };
    setSongs((prev) => [final, ...prev]);
  };
  const handleSaveBulk = (bulk: Song[]) => {
    const mapped = bulk.map((s) => {
      const cat = isAdmin ? s.category || adminLoadCategory : '#MIO';
      return { ...s, category: cat, tag: cat === '#MIO' ? 'MIO' as const : 'CONGRE' as const };
    });
    setSongs((prev) => [...mapped, ...prev]);
  };

  // Playlist handlers
  const handleCreatePlaylist = (name: string) => {
    const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    const pl: Playlist = { id, name: name.trim(), songIds: [], createdAt: now, updatedAt: now };
    setPlaylists((prev) => [...prev, pl]);
    setSelectedPlaylistId(id);
  };
  const handleSelectPlaylist = (id: string) => setSelectedPlaylistId(id || null);
  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlaylistId === id) setSelectedPlaylistId(null);
  };
  const handleAddSongToPlaylist = (songId: string) => {
    if (!selectedPlaylistId) return;
    setPlaylists((prev) => prev.map((p) => p.id === selectedPlaylistId ? { ...p, songIds: [...p.songIds, songId], updatedAt: Date.now() } : p));
  };
  const handleRemoveSongFromPlaylist = (_songId: string, index: number) => {
    if (!selectedPlaylistId) return;
    setPlaylists((prev) => prev.map((p) => {
      if (p.id !== selectedPlaylistId) return p;
      const ids = [...p.songIds];
      ids.splice(index, 1);
      return { ...p, songIds: ids, updatedAt: Date.now() };
    }));
  };
  const handleReorderPlaylist = (newSongIds: string[]) => {
    if (!selectedPlaylistId) return;
    setPlaylists((prev) => prev.map((p) => p.id === selectedPlaylistId ? { ...p, songIds: newSongIds, updatedAt: Date.now() } : p));
  };

  return (
    <div className={`h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col ${userProfile.darkMode ? 'dark bg-slate-900 text-white' : 'bg-[#e9ecf0] text-[#191c1e]'}`}>
      <NavigationDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentScreen={currentScreen} onNavigate={handleNavigate} />

      {currentScreen === 'search' && (
        <SearchSongsScreen songs={songs} onSelectSong={handleSelectSong} onOpenMenu={() => setIsMenuOpen(true)} onToggleFavorite={handleToggleFavorite} />
      )}

      {currentScreen === 'song' && (
        <SongModeScreen song={selectedSong} onBack={() => setCurrentScreen(previousScreen)} onOpenMenu={() => setIsMenuOpen(true)} onOpenSettings={() => setCurrentScreen('settings')} cipherSystem={userProfile.cipherSystem} />
      )}

      {currentScreen === 'setup' && (
        <InitialSetupScreen onComplete={handleSetupComplete} onBack={() => setCurrentScreen('login')} />
      )}

      {currentScreen === 'settings' && (
        <UserSettingsScreen profile={userProfile} onSave={handleSaveSettings} onCancel={() => setCurrentScreen('search')} onOpenMenu={() => setIsMenuOpen(true)} onAdminAccess={handleAdminLogin} isAdmin={isAdmin} />
      )}

      {currentScreen === 'login' && (
        <LoginScreen onLoginSuccess={() => setCurrentScreen('setup')} />
      )}

      {currentScreen === 'playlist' && (
        <PlaylistScreen
          songs={songs}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onCreatePlaylist={handleCreatePlaylist}
          onSelectPlaylist={handleSelectPlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onAddSong={handleAddSongToPlaylist}
          onRemoveSong={handleRemoveSongFromPlaylist}
          onReorder={handleReorderPlaylist}
          onOpenMenu={() => setIsMenuOpen(true)}
          cipherSystem={userProfile.cipherSystem}
        />
      )}

      {currentScreen === 'bible' && (
        <BibleScreen onOpenMenu={() => setIsMenuOpen(true)} />
      )}

      {currentScreen === 'allSongs' && (
        <AllSongsScreen songs={songs} onSelectSong={handleSelectSong} onOpenMenu={() => setIsMenuOpen(true)} onToggleFavorite={handleToggleFavorite} />
      )}
      {currentScreen === 'favorites' && (
        <FavoritesScreen songs={songs.filter((s) => s.isFavorite)} onSelectSong={handleSelectSong} onOpenMenu={() => setIsMenuOpen(true)} onToggleFavorite={handleToggleFavorite} />
      )}

      {currentScreen === 'loadSongs' && (
        <LoadSongsScreen
          onSaveSong={handleSaveSong}
          onSaveBulk={handleSaveBulk}
          onOpenMenu={() => setIsMenuOpen(true)}
          availableCategories={categories}
          defaultCategory={isAdmin ? adminLoadCategory : '#MIO'}
          isAdmin={isAdmin}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          categories={categories}
          onCreateCategory={handleCreateCategory}
          onDeleteCategory={handleDeleteCategory}
          onClose={() => setShowAdminPanel(false)}
          onOpenLoadRAV={() => { setAdminLoadCategory('#RAV'); setShowAdminPanel(false); setCurrentScreen('loadSongs'); }}
        />
      )}
    </div>
  );
}
