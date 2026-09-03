import React, { useState } from 'react';
import { ScreenView, Song, UserProfile } from './types';
import { INITIAL_SONGS } from './data/songs';
import { NavigationDrawer } from './components/NavigationDrawer';
import { SearchSongsScreen } from './components/SearchSongsScreen';
import { SongModeScreen } from './components/SongModeScreen';
import { InitialSetupScreen } from './components/InitialSetupScreen';
import { UserSettingsScreen } from './components/UserSettingsScreen';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  // Flujo PDF pag.8: P1 (login) -> P2 (setup) -> P3 (search/principal) -> resto vía menú
  // P1 es entry point, Modo Canción es transversal (no está en menú)
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>(INITIAL_SONGS);
  const [selectedSong, setSelectedSong] = useState<Song>(INITIAL_SONGS[0]);
  const [previousScreen, setPreviousScreen] = useState<ScreenView>('search');

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

  // Toggle song favorite
  const handleToggleFavorite = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  };

  // Open song - guarda origen para back (viene de search/playlist/allSongs/favorites)
  const handleSelectSong = (song: Song) => {
    setPreviousScreen(currentScreen);
    setSelectedSong(song);
    setCurrentScreen('song');
  };

  // Complete onboarding P2 -> P3
  // Soporta selección múltiple: instrument es el principal (guitarra si estaba seleccionada)
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
      congregationCodes: code
        ? Array.from(new Set([...prev.congregationCodes, code]))
        : prev.congregationCodes,
    }));
    setCurrentScreen('search');
  };

  // Navegación segura desde menú (guarda historial para Modo Canción)
  const handleNavigate = (screen: ScreenView) => {
    if (screen === 'song') return;
    setCurrentScreen(screen);
  };

  // Save profile settings
  const handleSaveSettings = (updated: UserProfile) => {
    setUserProfile(updated);
  };

  return (
    <div className={`min-h-screen p-2 md:p-4 ${userProfile.darkMode ? 'dark bg-slate-900 text-white' : 'bg-[#e9ecf0] text-[#191c1e]'}`}>
      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />

      {/* Screen Router */}
      {currentScreen === 'search' && (
        <SearchSongsScreen
          songs={songs}
          onSelectSong={handleSelectSong}
          onOpenMenu={() => setIsMenuOpen(true)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {currentScreen === 'song' && (
        <SongModeScreen
          song={selectedSong}
          onBack={() => setCurrentScreen(previousScreen)}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenSettings={() => setCurrentScreen('settings')}
          cipherSystem={userProfile.cipherSystem}
        />
      )}

      {currentScreen === 'setup' && (
        <InitialSetupScreen
          onComplete={handleSetupComplete}
          onBack={() => setCurrentScreen('login')}
        />
      )}

      {currentScreen === 'settings' && (
        <UserSettingsScreen
          profile={userProfile}
          onSave={handleSaveSettings}
          onCancel={() => setCurrentScreen('search')}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
      )}

      {currentScreen === 'login' && (
        <LoginScreen onLoginSuccess={() => setCurrentScreen('setup')} />
      )}

      {/* Placeholders vinculados - reutilizan SearchSongsScreen con filtros según imagen PDF */}
      {currentScreen === 'playlist' && (
        <SearchSongsScreen
          songs={songs}
          onSelectSong={handleSelectSong}
          onOpenMenu={() => setIsMenuOpen(true)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
      {currentScreen === 'allSongs' && (
        <SearchSongsScreen
          songs={songs}
          onSelectSong={handleSelectSong}
          onOpenMenu={() => setIsMenuOpen(true)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
      {currentScreen === 'favorites' && (
        <SearchSongsScreen
          songs={songs.filter((s) => s.isFavorite)}
          onSelectSong={handleSelectSong}
          onOpenMenu={() => setIsMenuOpen(true)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
