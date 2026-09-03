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
}: Omit<InitialSetupScreenProps, 'onOpenMenu'>) => {
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['guitarra']);
  const [congregationCode, setCongregationCode] = useState<string>('#RAV');

  const handleSelect = (id: string) => {
    setSelectedInstruments((prev) => {
      if (id === 'ninguno') return prev.includes('ninguno') ? [] : ['ninguno'];
      let next = prev.includes('ninguno') ? [] : [...prev];
      if (next.includes(id)) next = next.filter((x) => x !== id);
      else next.push(id);
      return next;
    });
  };

  const handleContinue = () => {
    const principal = selectedInstruments.includes('guitarra') ? 'guitarra' : selectedInstruments[0] || 'ninguno';
    onComplete(principal, congregationCode);
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col font-sans flow-bg border border-[#c3c6d1] shadow-sm">
      <header className="w-full shrink-0 bg-[#f7f9fb]/90 backdrop-blur-md border-b border-[#c3c6d1]/20">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-black/5 text-[#00305d] cursor-pointer flex items-center justify-center" title="Volver">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-[#00305d]">Configuración inicial</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col gap-4">
        <p className="text-[#43474f] text-sm sm:text-base shrink-0">Personalicemos tu experiencia=</p>

        {/* En desktop: layout horizontal para aprovechar ancho y reducir altura */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0">
          {/* Izquierda: instrumentos */}
          <section className="flex-1 flex flex-col gap-3 min-h-0">
            <h3 className="text-lg sm:text-xl font-semibold text-[#00305d] shrink-0">¿Qué instrumento tocas?</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
              {INSTRUMENTS.map((item) => {
                const isActive = selectedInstruments.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all active:scale-95 text-center min-h-[72px] ${isActive ? 'active-card bg-[#f2fdfb] border-2 border-[#3ED5B6]' : 'bg-white border border-[#c3c6d1] hover:bg-[#f2f4f6]'}`}
                  >
                    <span className={`material-symbols-outlined text-xl sm:text-2xl mb-1 ${isActive ? 'text-[#00305d] filled' : 'text-[#00305d]'}`}>{item.icon}</span>
                    <span className="font-semibold text-xs sm:text-sm leading-tight text-[#191c1e]">{item.name}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-[#43474f] text-xs bg-[#f2f4f6] px-3 py-2 rounded-lg border border-[#c3c6d1]/30 shrink-0">
              <span className="material-symbols-outlined text-base text-[#00305d]">info</span>
              <p className="leading-tight">Si eliges ninguno, se mostrarán los acordes de guitarra por defecto</p>
            </div>
          </section>

          {/* Derecha: código congregación - en desktop al lado, en móvil abajo */}
          <section className="lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-3 lg:border-l lg:border-[#c3c6d1]/30 lg:pl-6 xl:pl-8">
            <h3 className="text-lg sm:text-xl font-semibold text-[#00305d]">¿Tienes código de congregación?</h3>
            <div className="space-y-2">
              <div className="relative group">
                <input type="text" value={congregationCode} onChange={(e) => setCongregationCode(e.target.value)} placeholder="#RAV" className="w-full bg-white border border-[#737780] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006b59] font-medium" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#c3c6d1] group-focus-within:text-[#006b59] text-xl">church</span>
              </div>
              <p className="text-xs text-[#43474f] leading-snug">Introduce el código proporcionado por tu congregación para sincronizar repertorios y anuncios.</p>
            </div>
          </section>
        </div>
      </main>

      <nav className="shrink-0 w-full flex justify-between items-center px-4 sm:px-6 py-3 bg-white border-t border-[#c3c6d1]/30 shadow-lg">
        <button onClick={onBack} className="flex items-center gap-1 text-[#43474f] px-3 py-2 rounded-lg hover:bg-[#f2f4f6] cursor-pointer font-semibold text-sm">
          <span className="material-symbols-outlined text-lg">chevron_left</span><span>Back</span>
        </button>
        <div className="flex gap-1.5 items-center">
          <div className="h-2 w-6 rounded-full bg-[#00305d]" />
          <div className="h-2 w-2 rounded-full bg-[#c3c6d1]" />
          <div className="h-2 w-2 rounded-full bg-[#c3c6d1]" />
        </div>
        <button onClick={handleContinue} className="flex items-center gap-1 bg-[#00305d] text-white rounded-xl px-5 py-2.5 hover:bg-[#1a477a] shadow-md cursor-pointer font-semibold text-sm">
          <span>Continuar</span><span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </nav>
    </div>
  );
};
