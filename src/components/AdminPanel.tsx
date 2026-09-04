import React, { useState } from 'react';
import { Category } from '../types';

interface AdminPanelProps {
  categories: Category[];
  onCreateCategory: (label: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onClose: () => void;
  onOpenLoadRAV: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ categories, onCreateCategory, onDeleteCategory, onClose, onOpenLoadRAV }) => {
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    let clean = label.trim().toUpperCase();
    if (!clean) { setError('Falta etiqueta (ej: #IGLESIADELCENTRO)'); return; }
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (!/^#[A-Z0-9_]+$/.test(clean)) { setError('Usa solo letras/números y # al inicio'); return; }
    if (clean === '#MIO') { setError('#MIO es reservada para usuarios'); return; }
    if (categories.some((c) => c.label === clean)) { setError('Ya existe esa categoría'); return; }
    if (!name.trim()) { setError('Falta nombre descriptivo'); return; }
    onCreateCategory(clean, name.trim());
    setLabel(''); setName('');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-5 bg-[#00305d] text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Panel Admin</h2>
            <p className="text-xs text-[#8fb6f0]">Solo administradores — elala_bador_2026</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-[#00305d] flex items-center gap-2"><span className="material-symbols-outlined text-lg">category</span> Categorías</h3>
            <p className="text-xs text-gray-500">Crea sesiones como #RAV, #IGLESIADELCENTRO, etc. Solo el admin puede crear. #MIO es solo para usuarios.</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f2f4f6] border border-[#c3c6d1] rounded-full text-xs font-bold">
                  <span className="text-[#1A477A]">{c.label}</span><span className="text-gray-500 font-normal">— {c.name}</span>
                  {c.label !== '#MIO' && c.label !== '#RAV' && (
                    <button onClick={() => onDeleteCategory(c.id)} className="ml-1 text-gray-400 hover:text-red-600 cursor-pointer">✕</button>
                  )}
                </span>
              ))}
            </div>
            <div className="bg-[#f7f9fb] border border-[#c3c6d1]/40 rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="#IGLESIADELCENTRO" className="px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre ej: Iglesia del Centro" className="px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              </div>
              {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
              <button onClick={handleCreate} className="w-full py-2.5 bg-[#1A477A] text-white rounded-xl text-sm font-bold hover:bg-[#00305d] cursor-pointer">Crear categoría</button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-[#00305d] flex items-center gap-2"><span className="material-symbols-outlined text-lg">library_add</span> Cargar canciones a #RAV</h3>
            <p className="text-xs text-gray-500">Solo admin puede agregar a #RAV (y a categorías creadas). El resto de usuarios solo a #MIO.</p>
            <button onClick={onOpenLoadRAV} className="w-full py-3 bg-[#1A477A] text-white rounded-xl font-bold text-sm hover:bg-[#00305d] cursor-pointer">Ir a cargar en #RAV</button>
          </section>
        </div>

        <div className="p-4 border-t border-gray-100 bg-[#f7f9fb] flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm font-bold text-[#43474f] hover:bg-gray-50 cursor-pointer">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
