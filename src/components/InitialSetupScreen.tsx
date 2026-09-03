import React, { useState } from 'react';
import { InstrumentOption } from '../types';

interface InitialSetupScreenProps {
  onComplete: (instrument: string, code: string) => void;
  onBack: () => void;
  onOpenMenu?: () => void;
}

const INSTRUMENTS: InstrumentOption[] = [
  { id: 'voz', name: 'Voz', icon: 'mic' },
  { id: 'guitarra', name: 'Guitarra', icon: 'straighten' },
  { id: 'piano', name: 'Piano', icon: 'piano' },
  { id: 'ukelele', name: 'Ukelele', icon: 'music_note' },
  { id: 'bateria', name: 'Batería', icon: 'music_note' },
  { id: 'bajo', name: 'Bajo', icon: 'graphic_eq' },
  { id: 'cajon', name: 'Cajón', icon: 'inventory_2' },
  { id: 'pandereta', name: 'Pandereta', icon: 'vibration' },
  { id: 'saxofon', name: 'Saxofón', icon: 'file_download' },
  { id: 'violin', name: 'Violín', icon: 'data_usage' },
  { id: 'otro', name: 'Otro', icon: 'add_circle' },
  { id: 'ninguno', name: 'Ninguno', icon: 'block' },
];

export const InitialSetupScreen: React.FC<InitialSetupScreenProps> = ({
  onComplete,
  onBack,
}: // onOpenMenu removido: PDF indica que en P2 no debe haber círculo de menú todavía
Omit<InitialSetupScreenProps, 'onOpenMenu'>) => {
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['guitarra']);
  const [congregationCode, setCongregationCode] = useState<string>('#RAV');

  const handleSelect = (id: string) => {
    setSelectedInstruments((prev) => {
      // Caso especial "ninguno" es excluyente
      if (id === 'ninguno') {
        return prev.includes('ninguno') ? [] : ['ninguno'];
      }
      // Si había "ninguno", lo quita y pone el nuevo
      let next = prev.includes('ninguno') ? [] : [...prev];
      if (next.includes(id)) {
        next = next.filter((x) => x !== id);
      } else {
        next.push(id);
      }
      return next;
    });
  };

  const handleContinue = () => {
    // Regla: si hay >1 y uno es guitarra, principal = guitarra, si no el primero
    const principal = selectedInstruments.includes('guitarra')
      ? 'guitarra'
      : selectedInstruments[0] || 'ninguno';
    onComplete(principal, congregationCode);
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col items-center font-sans flow-bg relative pb-32 border border-[#c3c6d1] shadow-sm">
      {/* TopAppBar */}
      <header className="w-full sticky top-0 bg-[#f7f9fb]/90 backdrop-blur-md z-50 border-b border-[#c3c6d1]/20">
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-black/5 text-[#00305d] cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
              title="Volver"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#00305d]">Configuración inicial</h1>
          </div>
          {/* Círculo menú oculto en P2 por spec */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl px-4 sm:px-8 pt-8 space-y-10">
        {/* Welcome Intro */}
        <section>
          <p className="text-[#43474f] max-w-2xl text-lg font-normal">
            Personalicemos tu experiencia=
          </p>
        </section>

        {/* Section A: Instruments */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[#00305d]">
              ¿Qué instrumento tocas?
            </h3>
          </div>

          {/* Instrument Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {INSTRUMENTS.map((item) => {
              const isActive = selectedInstruments.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all active:scale-95 text-center ${
                    isActive
                      ? 'active-card bg-[#f2fdfb] border-2 border-[#3ED5B6] shadow-xs'
                      : 'bg-white border border-[#c3c6d1] hover:bg-[#f2f4f6]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-3xl mb-2 ${
                      isActive ? 'text-[#00305d] filled' : 'text-[#00305d]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-semibold text-sm text-[#191c1e]">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Info Notice */}
          <div className="flex items-center gap-3 text-[#43474f] text-sm bg-[#f2f4f6] p-4 rounded-lg border border-[#c3c6d1]/30">
            <span className="material-symbols-outlined text-xl text-[#00305d]">
              info
            </span>
            <p>
              Si eliges ninguno, se mostrarán los acordes de guitarra por defecto
            </p>
          </div>
        </section>

        {/* Section B: Congregation Code */}
        <section className="max-w-xl space-y-4">
          <h3 className="text-2xl font-semibold text-[#00305d]">
            ¿Tienes código de congregación?
          </h3>
          <div className="space-y-3">
            <div className="relative group">
              <input
                type="text"
                value={congregationCode}
                onChange={(e) => setCongregationCode(e.target.value)}
                placeholder="#RAV"
                className="w-full bg-white border border-[#737780] rounded-lg px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-[#006b59] focus:border-[#006b59] transition-all placeholder:text-[#c3c6d1] font-medium"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#c3c6d1] group-focus-within:text-[#006b59] text-2xl">
                church
              </span>
            </div>
            <p className="text-sm text-[#43474f]">
              Introduce el código proporcionado por tu congregación para sincronizar
              repertorios y anuncios.
            </p>
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-between items-center px-6 py-4 bg-white border-t border-[#c3c6d1]/30 z-50 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#43474f] px-4 py-2 rounded-lg hover:bg-[#f2f4f6] transition-all cursor-pointer active:scale-95 group font-semibold text-sm"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
            chevron_left
          </span>
          <span>Back</span>
        </button>

        {/* Visual progress dots */}
        <div className="flex gap-2 items-center">
          <div className="h-2 w-8 rounded-full bg-[#00305d]" />
          <div className="h-2 w-2 rounded-full bg-[#c3c6d1]" />
          <div className="h-2 w-2 rounded-full bg-[#c3c6d1]" />
        </div>

        <button
          onClick={handleContinue}
          className="flex items-center gap-2 bg-[#00305d] text-white rounded-xl px-7 py-3 hover:bg-[#1a477a] transition-all shadow-md active:scale-95 group cursor-pointer font-semibold text-sm"
        >
          <span>Continuar</span>
          <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
            chevron_right
          </span>
        </button>
      </nav>
    </div>
  );
};
