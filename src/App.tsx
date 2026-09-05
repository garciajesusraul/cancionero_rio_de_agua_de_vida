import React, { useState, useEffect, useRef } from 'react';
import { ScreenView, Song, UserProfile, Playlist } from './types';
import { INITIAL_SONGS } from './data/songs';
import { supabase } from './utils/supabase';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try { return localStorage.getItem('rav_auth') === '1'; } catch { return false; }
  });
  const [currentScreen, setCurrentScreen] = useState<ScreenView>(() => {
    try { return localStorage.getItem('rav_auth') === '1' ? 'search' as ScreenView : 'login' as ScreenView; } catch { return 'login' as ScreenView; }
  });

  // Sincroniza sesión Supabase si está configurado (migrado)
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsAuthenticated(true);
        setCurrentScreen((prev) => prev === 'login' ? 'search' : prev);
        try { localStorage.setItem('rav_auth', '1'); } catch {}
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        try { localStorage.setItem('rav_auth', '1'); } catch {}
      } else {
        // No cerrar automáticamente si hay fallback local; solo si no hay rav_auth
        // Se maneja en handleLogout
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // IDs de canciones seed a purgar para dejar app limpia #RAV
  const LEGACY_SONG_IDS = new Set([
    'senor-mi-dios','que-ruja-el-leon','quien-podra','piedra-angular','yeshua',
    'vistenos-de-danza','resplandece-tu-luz','al-que-esta-sentado','jesus-es-agua-de-vida'
  ]);

  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const raw = localStorage.getItem(SONGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Song[];
        // Purga legacy: filtra canciones demo y limpia favoritos legacy
        const filtered = parsed.filter((s) => !LEGACY_SONG_IDS.has(s.id));
        const ids = new Set(filtered.map((s) => s.id));
        // INITIAL_SONGS ahora vacío, no agrega nada
        const merged = [...filtered, ...INITIAL_SONGS.filter((s) => !ids.has(s.id))];
        // Si había legacy, sobrescribe localStorage limpio
        if (filtered.length !== parsed.length) {
          try { localStorage.setItem(SONGS_KEY, JSON.stringify(filtered)); } catch {}
        }
        return merged;
      }
    } catch {}
    return INITIAL_SONGS;
  });
  const [selectedSong, setSelectedSong] = useState<Song | null>(INITIAL_SONGS[0] ?? null);
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
  const hasFetchedSupabase = useRef(false);

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

  // Playlists con persistencia localStorage (preparado para Supabase) + purga legacy
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const raw = localStorage.getItem(PLAYLISTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Playlist[];
        // Limpia referencias a canciones demo
        const cleaned = parsed.map((p) => ({ ...p, songIds: p.songIds.filter((id) => !LEGACY_SONG_IDS.has(id)) }));
        if (JSON.stringify(cleaned) !== raw) {
          try { localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(cleaned)); } catch {}
        }
        return cleaned;
      }
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

  // --- Supabase sync ---
  // Carga inicial desde Supabase (si hay datos, mergea sobre local)
  useEffect(() => {
    if (!supabase || hasFetchedSupabase.current) return;
    hasFetchedSupabase.current = true;
    (async () => {
      try {
        const [{ data: dbSongs }, { data: dbCats }, { data: dbPlaylists }] = await Promise.all([
          supabase.from('songs').select('*'),
          supabase.from('categories').select('*'),
          supabase.from('playlists').select('*'),
        ]);
        if (dbSongs && dbSongs.length > 0) {
          const mapped: Song[] = dbSongs.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            title: r.title as string,
            artist: r.artist as string,
            tag: r.tag as Song['tag'],
            category: r.category as string | undefined,
            bpm: (r.bpm as number) || 70,
            originalKey: (r.original_key as string) || (r.originalKey as string) || 'C',
            sections: (r.sections as Song['sections']) || [],
            isFavorite: r.is_favorite as boolean | undefined,
            favoriteAt: r.favorite_at as number | undefined,
            createdAt: r.created_at as number | undefined,
          }));
          // Purga automática de demos legacy tanto en memoria como en Supabase
          const legacyInDb = mapped.filter((s) => LEGACY_SONG_IDS.has(s.id));
          if (legacyInDb.length > 0) {
            for (const s of legacyInDb) {
              supabase.from('songs').delete().eq('id', s.id).then(() => {}).catch(() => {});
            }
          }
          const cleanMapped = mapped.filter((s) => !LEGACY_SONG_IDS.has(s.id));
          if (cleanMapped.length === 0 && legacyInDb.length > 0) {
            // Si solo había demos, deja lista vacía
            setSongs((prev) => prev.filter((p) => !LEGACY_SONG_IDS.has(p.id)));
          } else {
            setSongs((prev) => {
              const ids = new Set(prev.map((s) => s.id));
              const newFromDb = cleanMapped.filter((s) => !ids.has(s.id));
              return newFromDb.length > 0 ? [...newFromDb, ...prev.filter((p) => !LEGACY_SONG_IDS.has(p.id))] : prev.filter((p) => !LEGACY_SONG_IDS.has(p.id));
            });
          }
        } else {
          // No hay DB, igual purga local por si quedó legacy
          setSongs((prev) => {
            const filtered = prev.filter((s) => !LEGACY_SONG_IDS.has(s.id));
            return filtered.length !== prev.length ? filtered : prev;
          });
        }
        if (dbCats && dbCats.length > 0) {
          const mappedCats: Category[] = dbCats.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            label: r.label as string,
            name: r.name as string,
            createdAt: r.created_at as number,
          }));
          setCategories((prev) => {
            const labels = new Set(prev.map((c) => c.label));
            const add = mappedCats.filter((c) => !labels.has(c.label));
            return add.length > 0 ? [...prev, ...add] : prev;
          });
        }
        if (dbPlaylists && dbPlaylists.length > 0) {
          const mappedPl: Playlist[] = dbPlaylists.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            name: r.name as string,
            songIds: (r.song_ids as string[]) || (r.songIds as string[]) || [],
            createdAt: r.created_at as number,
            updatedAt: r.updated_at as number,
          }));
          setPlaylists((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            const add = mappedPl.filter((p) => !ids.has(p.id));
            return add.length > 0 ? [...prev, ...add] : prev;
          });
        }
      } catch (e) {
        console.warn('Supabase fetch error', e);
      }
    })();
  }, []);

  // Push a Supabase en cada cambio (debounce simple)
  useEffect(() => {
    if (!supabase) return;
    if (!hasFetchedSupabase.current) return;
    const t = setTimeout(async () => {
      try {
        if (songs.length > 0) {
          const rows = songs.slice(0, 200).map((s) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            tag: s.tag,
            category: s.category || null,
            bpm: s.bpm,
            original_key: s.originalKey,
            sections: s.sections,
            is_favorite: !!s.isFavorite,
            favorite_at: s.favoriteAt || null,
            created_at: s.createdAt || Date.now(),
          }));
          await supabase.from('songs').upsert(rows, { onConflict: 'id' });
        }
      } catch (e) { console.warn('Supabase upsert songs', e); }
    }, 800);
    return () => clearTimeout(t);
  }, [songs]);

  useEffect(() => {
    if (!supabase || !hasFetchedSupabase.current) return;
    const t = setTimeout(async () => {
      try {
        if (categories.length > 0) {
          const rows = categories.map((c) => ({ id: c.id, label: c.label, name: c.name, created_at: c.createdAt }));
          await supabase.from('categories').upsert(rows, { onConflict: 'id' });
        }
      } catch (e) { console.warn('Supabase upsert categories', e); }
    }, 800);
    return () => clearTimeout(t);
  }, [categories]);

  useEffect(() => {
    if (!supabase || !hasFetchedSupabase.current) return;
    const t = setTimeout(async () => {
      try {
        if (playlists.length > 0) {
          const rows = playlists.map((p) => ({ id: p.id, name: p.name, song_ids: p.songIds, created_at: p.createdAt, updated_at: p.updatedAt }));
          await supabase.from('playlists').upsert(rows, { onConflict: 'id' });
        }
      } catch (e) { console.warn('Supabase upsert playlists', e); }
    }, 800);
    return () => clearTimeout(t);
  }, [playlists]);

  const handleToggleFavorite = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSongs((prev) => prev.map((s) => {
      if (s.id !== songId) return s;
      const willBeFav = !s.isFavorite;
      return { ...s, isFavorite: willBeFav, favoriteAt: willBeFav ? Date.now() : undefined };
    }));
  };

  const handleSelectSong = (song: Song) => {
    if (!song) return;
    setPreviousScreen(currentScreen);
    setSelectedSong(song);
    setCurrentScreen('song');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    try { localStorage.setItem('rav_auth', '1'); } catch {}
    setCurrentScreen('search');
  };
  const handleLogout = async () => {
    setIsAuthenticated(false);
    try { localStorage.removeItem('rav_auth'); } catch {}
    if (supabase) { try { await supabase.auth.signOut(); } catch {} }
    setCurrentScreen('login');
  };

  const handleSetupComplete = (instrument: string, code: string) => {
    if (!isAuthenticated) return;
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
    if (!isAuthenticated) { setCurrentScreen('login'); return; }
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
    if (supabase) supabase.from('categories').delete().eq('id', id).then(() => {}).catch(() => {});
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

  const handleDeleteSong = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    setPlaylists((prev) => prev.map((p) => ({ ...p, songIds: p.songIds.filter((id) => id !== songId) })));
    if (supabase) supabase.from('songs').delete().eq('id', songId).then(() => {}).catch(() => {});
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
    if (supabase) supabase.from('playlists').delete().eq('id', id).then(() => {}).catch(() => {});
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

  // Gate: sin auth no se renderiza nada más que login
  if (!isAuthenticated) {
    return (
      <div className={`h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col ${userProfile.darkMode ? 'dark bg-slate-900 text-white' : 'bg-[#e9ecf0] text-[#191c1e]'}`}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col ${userProfile.darkMode ? 'dark bg-slate-900 text-white' : 'bg-[#e9ecf0] text-[#191c1e]'}`}>
      <NavigationDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentScreen={currentScreen} onNavigate={handleNavigate} onLogout={handleLogout} />

      {currentScreen === 'search' && (
        <SearchSongsScreen songs={songs} onSelectSong={handleSelectSong} onOpenMenu={() => setIsMenuOpen(true)} onToggleFavorite={handleToggleFavorite} />
      )}

      {currentScreen === 'song' && selectedSong && (
        <SongModeScreen song={selectedSong} onBack={() => setCurrentScreen(previousScreen)} onOpenMenu={() => setIsMenuOpen(true)} onOpenSettings={() => setCurrentScreen('settings')} cipherSystem={userProfile.cipherSystem} />
      )}

      {currentScreen === 'setup' && (
        <InitialSetupScreen onComplete={handleSetupComplete} onBack={handleLogout} />
      )}

      {currentScreen === 'settings' && (
        <UserSettingsScreen profile={userProfile} onSave={handleSaveSettings} onCancel={() => setCurrentScreen('search')} onOpenMenu={() => setIsMenuOpen(true)} onAdminAccess={handleAdminLogin} isAdmin={isAdmin} />
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
        <AllSongsScreen songs={songs} onSelectSong={handleSelectSong} onOpenMenu={() => setIsMenuOpen(true)} onToggleFavorite={handleToggleFavorite} onDeleteSong={handleDeleteSong} />
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
