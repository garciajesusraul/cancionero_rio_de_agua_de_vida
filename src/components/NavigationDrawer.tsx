import React from 'react';
import { ScreenView } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  onLogout?: () => void;
  quote?: string;
  quoteRef?: string;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onNavigate,
  onLogout,
}) => {
  if (!isOpen) return null;

  const menuItems: { id: ScreenView; label: string; icon: string; desc: string }[] = [
    { id: 'search', label: 'Pantalla principal', icon: 'home', desc: 'Búsqueda + recientes + favoritos' },
    { id: 'playlist', label: 'Playlist', icon: 'queue_music', desc: 'Listas guardadas y crear lista' },
    { id: 'allSongs', label: 'Todas las alabanzas', icon: 'library_music', desc: 'Tabs #MIO y #RAV' },
    { id: 'favorites', label: 'Alabanzas favoritas ❤️', icon: 'favorite', desc: 'Filtro alfabético / última agregada' },
    { id: 'bible', label: 'La Biblia', icon: 'auto_stories', desc: 'LBLA (default) / NTV — api.bible' },
    { id: 'loadSongs', label: 'Cargar canciones', icon: 'upload', desc: 'Manual y masiva .txt' },
    { id: 'settings', label: 'Ajustes de Usuario', icon: 'settings', desc: 'Perfil, códigos, instrumentos y audio' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex justify-end lg:justify-center lg:items-center lg:p-6">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Compacto para que entre en una sola ventana sin scroll */}
      <div className="relative w-80 max-w-[85vw] lg:w-[720px] xl:w-[820px] lg:max-w-[90vw] bg-white h-auto max-h-[92vh] lg:max-h-[88vh] rounded-2xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-right lg:slide-in-from-bottom duration-200 overflow-hidden my-auto">
        <div className="p-4 sm:p-5 bg-[#00305d] text-white flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1a477a] flex items-center justify-center text-white border border-[#3ED5B6]/30">
              <span className="material-symbols-outlined text-xl sm:text-2xl">waves</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white cursor-pointer" title="Cerrar menú">
              <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
            </button>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold leading-tight">Río de Agua Viva</h2>
            <p className="text-[11px] sm:text-xs text-[#8fb6f0]">Menú Principal</p>
          </div>
        </div>

        <div className="flex-none py-2 sm:py-3 px-2 sm:px-3 overflow-hidden">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#737780]">Pantallas</div>
          {/* Siempre 2 columnas para que entre todo sin scroll */}
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
            {menuItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all text-left cursor-pointer ${isActive ? 'bg-[#1a477a] text-white shadow-sm font-semibold' : 'text-[#191c1e] hover:bg-[#f2f4f6]'}`}
                >
                  <span className={`material-symbols-outlined text-xl sm:text-2xl shrink-0 ${isActive ? 'text-[#3ED5B6]' : 'text-[#00305d]'}`}>{item.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-medium leading-tight truncate">{item.label}</span>
                    <span className={`text-[10px] sm:text-[11px] leading-tight truncate ${isActive ? 'text-[#8fb6f0]' : 'text-[#737780]'}`}>{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="py-2 sm:py-3 border-t border-[#c3c6d1]/30 bg-[#f7f9fb] text-center shrink-0 space-y-2">
          {onLogout && (
            <button onClick={() => { onClose(); onLogout(); }} className="mx-auto flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#ba1a1a] hover:bg-red-50 rounded-full border border-red-200 cursor-pointer">
              <span className="material-symbols-outlined text-sm">logout</span> Cerrar sesión
            </button>
          )}
          <span className="text-[10px] text-[#737780]/70 font-medium block">v3.5_casa_vacia • Río de Agua Viva</span>
        </div>
      </div>
    </div>
  );
};
