import React from 'react';
import { ScreenView } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  quote?: string;
  quoteRef?: string;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const menuItems: { id: ScreenView; label: string; icon: string; desc: string }[] = [
    { id: 'search', label: 'Pantalla principal', icon: 'home', desc: 'Búsqueda + recientes + favoritos' },
    { id: 'playlist', label: 'Playlist', icon: 'queue_music', desc: 'Listas guardadas y crear lista' },
    { id: 'allSongs', label: 'Todas las alabanzas', icon: 'library_music', desc: 'Tabs #mio y #RAV' },
    { id: 'favorites', label: 'Alabanzas favoritas ❤️', icon: 'favorite', desc: 'Filtro alfabético / última agregada' },
    { id: 'settings', label: 'Ajustes de Usuario', icon: 'settings', desc: 'Perfil, códigos, instrumentos y audio' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex justify-end lg:justify-center lg:items-center lg:p-6">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Móvil/Tablet: drawer vertical estrecho - Desktop: panel ancho horizontal */}
      <div className="relative w-80 max-w-[85vw] lg:w-[720px] xl:w-[820px] lg:max-w-[90vw] bg-white h-full lg:h-auto lg:max-h-[85vh] lg:rounded-2xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-right lg:slide-in-from-bottom duration-200 overflow-hidden">
        <div className="p-6 bg-[#00305d] text-white flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-full bg-[#1a477a] flex items-center justify-center text-white border border-[#3ED5B6]/30">
              <span className="material-symbols-outlined text-2xl">waves</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white cursor-pointer" title="Cerrar menú">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">Río de Agua Viva</h2>
            <p className="text-xs text-[#8fb6f0]">Menú Principal</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#737780]">Pantallas</div>
          {/* En desktop: grid 2 columnas horizontal para aprovechar ancho */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
            {menuItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer ${isActive ? 'bg-[#1a477a] text-white shadow-sm font-semibold' : 'text-[#191c1e] hover:bg-[#f2f4f6]'}`}
                >
                  <span className={`material-symbols-outlined text-2xl ${isActive ? 'text-[#3ED5B6]' : 'text-[#00305d]'}`}>{item.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className={`text-[11px] ${isActive ? 'text-[#8fb6f0]' : 'text-[#737780]'}`}>{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-[#c3c6d1]/30 bg-[#f7f9fb] text-center text-xs text-[#737780] shrink-0">
          <p className="italic">"Agua Viva en tu corazón"</p>
          <span className="text-[10px] text-[#737780]/70 font-medium mt-0.5 block">v2.4.0 • Río de Agua Viva</span>
        </div>
      </div>
    </div>
  );
};
