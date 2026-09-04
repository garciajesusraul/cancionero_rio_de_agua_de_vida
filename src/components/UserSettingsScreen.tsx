import React, { useState, useEffect } from 'react';
import { UserProfile, CipherSystem } from '../types';
import { audioEngine } from '../utils/AudioEngine';

interface UserSettingsScreenProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onCancel: () => void;
  onOpenMenu: () => void;
  onAdminAccess?: (password: string) => boolean;
  isAdmin?: boolean;
}

export const UserSettingsScreen: React.FC<UserSettingsScreenProps> = ({
  profile,
  onSave,
  onCancel,
  onOpenMenu,
  onAdminAccess,
  isAdmin,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.photoUrl || null);
  const [previewPad, setPreviewPad] = useState<string | null>(null);
  const [previewDrum, setPreviewDrum] = useState<string | null>(null);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => { return () => { audioEngine.stopPreviews(); }; }, []);

  const handleAddCode = () => {
    if (!newCodeInput.trim()) return;
    const formatted = newCodeInput.startsWith('#')
      ? newCodeInput.toUpperCase()
      : `#${newCodeInput.toUpperCase()}`;
    if (!formData.congregationCodes.includes(formatted)) {
      setFormData((prev) => ({
        ...prev,
        congregationCodes: [...prev.congregationCodes, formatted],
      }));
    }
    setNewCodeInput('');
  };

  const handleRemoveCode = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      congregationCodes: prev.congregationCodes.filter((c) => c !== code),
    }));
  };

  const handleToggleOtherInstrument = (inst: string) => {
    setFormData((prev) => {
      const exists = prev.otherInstruments.includes(inst);
      return {
        ...prev,
        otherInstruments: exists
          ? prev.otherInstruments.filter((i) => i !== inst)
          : [...prev.otherInstruments, inst],
      };
    });
  };

  const handleSave = () => {
    onSave(formData);
    setToastMessage('¡Ajustes guardados correctamente!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isDark = formData.darkMode;

  return (
    <div className={`h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col items-center font-sans border shadow-sm ${isDark ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-[#f7f9fb] text-[#191c1e] border-[#c3c6d1]'}`}>
      {/* Header */}
      <header className={`w-full shrink-0 border-b z-40 shadow-2xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#c3c6d1]/40'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#00305d]'}`}>Ajustes de Perfil</h1>
          </div>
          
          <button
            onClick={onOpenMenu}
            className="flex-shrink-0 bg-[#1A477A] text-white rounded-full p-2.5 w-11 h-11 flex items-center justify-center cursor-pointer hover:bg-[#00305d] transition-transform active:scale-95 shadow-sm"
            title="Menú Principal"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
      </header>

      {/* Main Form Container - en desktop 2 columnas para aprovechar horizontal */}
      <main className="w-full max-w-5xl flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-8 pt-4 md:pt-6 space-y-4 md:space-y-6">
        {/* User Profile Card - ancho completo */}
        <section className="bg-white border border-[#c3c6d1]/60 rounded-2xl p-6 text-center shadow-2xs relative overflow-hidden flow-bg">
          <div className="relative inline-block mb-4">
            {photoPreview || formData.photoUrl ? (
              <img
                src={photoPreview || formData.photoUrl}
                alt="Foto de perfil"
                className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#1a477a] text-white flex items-center justify-center text-3xl font-bold shadow-md border-4 border-white">
                {formData.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'EB'}
              </div>
            )}
            <button
              onClick={() => {
                setEditName(formData.name);
                setPhotoPreview(formData.photoUrl || null);
                setIsProfileEditOpen(true);
              }}
              className="absolute bottom-0 right-0 bg-[#00305d] text-white p-2 rounded-full shadow-md hover:bg-[#3ED5B6] transition-colors cursor-pointer"
              title="Editar nombre y foto"
            >
              <span className="material-symbols-outlined text-base">edit</span>
            </button>
          </div>
          <h2 className="text-xl font-bold text-[#00305d]">{formData.name}</h2>
          <p className="text-xs text-[#737780] mt-1 font-medium">
            {formData.memberSince}
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4 md:space-y-6">
        {/* Section: Códigos de Congregación */}
        <section className="bg-white border border-[#c3c6d1]/60 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-[#00305d] font-bold text-base">
            <span className="material-symbols-outlined">group</span>
            <h3>Códigos de Congregación</h3>
          </div>

          {/* Active Tags */}
          <div className="flex flex-wrap gap-2">
            {formData.congregationCodes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f2f4f6] border border-[#c3c6d1] rounded-full text-xs font-bold text-[#00305d]"
              >
                <span>{code}</span>
                <button
                  onClick={() => handleRemoveCode(code)}
                  className="hover:text-red-600 cursor-pointer text-sm"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          {/* Add Code Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#43474f]">
              Añadir Código
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCodeInput}
                onChange={(e) => setNewCodeInput(e.target.value)}
                placeholder="Ej: #NUEVO"
                className="flex-1 px-4 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]"
              />
              <button
                onClick={handleAddCode}
                className="bg-[#00305d] text-white px-4 rounded-xl hover:bg-[#1a477a] transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-xl">add</span>
              </button>
            </div>
          </div>

          {/* Temporal Code Input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-[#43474f] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Código de activación temporal</span>
            </label>
            <input
              type="text"
              value={formData.tempCode}
              onChange={(e) =>
                setFormData((p) => ({ ...p, tempCode: e.target.value }))
              }
              placeholder="Ingrese código temporal"
              className="w-full px-4 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]"
            />
            <p className="text-[11px] text-[#737780]">
              ⓘ Sincroniza repertorios para un evento específico.
            </p>
          </div>
        </section>

        {/* Section: Preferencias Musicales */}
        <section className="bg-white border border-[#c3c6d1]/60 rounded-2xl p-6 space-y-5 shadow-2xs">
          <div className="flex items-center gap-2 text-[#00305d] font-bold text-base">
            <span className="material-symbols-outlined">music_note</span>
            <h3>Preferencias Musicales</h3>
          </div>

          {/* Instrumento Principal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#43474f]">
              Instrumento Principal
            </label>
            <select
              value={formData.mainInstrument}
              onChange={(e) =>
                setFormData((p) => ({ ...p, mainInstrument: e.target.value }))
              }
              className="w-full px-4 py-3 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6] font-medium"
            >
              <option value="Voz">Voz</option>
              <option value="Guitarra">Guitarra</option>
              <option value="Piano">Piano</option>
              <option value="Batería">Batería</option>
              <option value="Bajo">Bajo</option>
              <option value="Ukelele">Ukelele</option>
            </select>
          </div>

          {/* Otros Instrumentos */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#43474f]">
              Otros instrumentos que tocas
            </label>
            <div className="flex flex-wrap gap-2">
              {['Guitarra', 'Piano', 'Bajo', 'Batería'].map((inst) => {
                const isSelected = formData.otherInstruments.includes(inst);
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => handleToggleOtherInstrument(inst)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#00305d] text-white border-[#00305d] shadow-2xs'
                        : 'bg-white text-[#43474f] border-[#c3c6d1] hover:bg-[#f2f4f6]'
                    }`}
                  >
                    {inst} {isSelected ? '✓' : ''}
                  </button>
                );
              })}
              <button
                type="button"
                className="px-3 py-2 rounded-full text-xs font-semibold text-[#00305d] border border-dashed border-[#00305d] hover:bg-[#f2f4f6]"
              >
                + Más opciones
              </button>
            </div>
          </div>

          {/* Sistema de Cifrado */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-[#43474f]">
              Sistema de Cifrado
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* American Card */}
              <div
                onClick={() =>
                  setFormData((p) => ({ ...p, cipherSystem: 'American' }))
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.cipherSystem === 'American'
                    ? 'border-[#00305d] bg-[#d4e3ff]/30 ring-2 ring-[#00305d]'
                    : 'border-[#c3c6d1] hover:bg-[#f2f4f6]'
                }`}
              >
                <div className="font-bold text-sm text-[#00305d]">Americano</div>
                <div className="text-xs text-[#737780] mt-0.5">
                  C, D, E, F, G, A, B
                </div>
              </div>

              {/* Latino Card */}
              <div
                onClick={() =>
                  setFormData((p) => ({ ...p, cipherSystem: 'Latino' }))
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.cipherSystem === 'Latino'
                    ? 'border-[#00305d] bg-[#d4e3ff]/30 ring-2 ring-[#00305d]'
                    : 'border-[#c3c6d1] hover:bg-[#f2f4f6]'
                }`}
              >
                <div className="font-bold text-sm text-[#00305d]">Latino</div>
                <div className="text-xs text-[#737780] mt-0.5">
                  Do, Re, Mi, Fa, Sol, La, Si
                </div>
              </div>
            </div>
          </div>
        </section>
          </div>
          <div className="space-y-4 md:space-y-6">
        {/* Section: Acompañamiento y Audio */}
        <section className="bg-white border border-[#c3c6d1]/60 rounded-2xl p-6 space-y-5 shadow-2xs">
          <div className="flex items-center gap-2 text-[#00305d] font-bold text-base">
            <span className="material-symbols-outlined">equalizer</span>
            <h3>Acompañamiento y Audio</h3>
          </div>
          <p className="text-xs text-[#737780]">
            Configuración global de acompañamiento por defecto
          </p>

          {/* Tempo Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[#43474f]">
                Tempo (BPM)
              </label>
              <span className="bg-[#00305d] text-white font-bold text-xs px-3 py-1 rounded-lg">
                {formData.defaultBpm}
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="200"
              value={formData.defaultBpm}
              onChange={(e) =>
                setFormData((p) => ({ ...p, defaultBpm: Number(e.target.value) }))
              }
              className="w-full accent-[#00305d] cursor-pointer"
            />
          </div>

          {/* Worship Pad Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#43474f]">
              Worship Pad Style
            </label>
            <div className="flex gap-2">
              <select
                value={formData.padStyle}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, padStyle: e.target.value }))
                }
                className="flex-1 px-4 py-3 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]"
              >
                <option value="Bright Shimmer">Bright Shimmer</option>
                <option value="Warm Ambient">Warm Ambient</option>
                <option value="Deep Celestial">Deep Celestial</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (previewPad) {
                    audioEngine.stopPreviews(); setPreviewPad(null);
                    // si era otro estilo, arranca el nuevo
                    if (previewPad !== formData.padStyle) {
                      setTimeout(() => {
                        audioEngine.previewPadStyle(formData.padStyle);
                        setPreviewPad(formData.padStyle);
                        setTimeout(() => setPreviewPad(null), 3300);
                      }, 120);
                    }
                    setPreviewDrum(null);
                    return;
                  }
                  audioEngine.previewPadStyle(formData.padStyle);
                  setPreviewPad(formData.padStyle);
                  setPreviewDrum(null);
                  setTimeout(() => setPreviewPad(null), 3300);
                }}
                className={`w-12 flex-shrink-0 flex items-center justify-center rounded-xl border text-sm transition-colors cursor-pointer ${previewPad ? 'bg-[#00305d] text-white border-[#00305d] animate-pulse' : 'bg-white border-[#c3c6d1] text-[#00305d] hover:bg-[#f2f4f6]'}`}
                title={previewPad ? 'Detener' : 'Reproducir ejemplo'}
              >
                <span className="material-symbols-outlined text-xl">{previewPad ? 'stop' : 'play_arrow'}</span>
              </button>
            </div>
          </div>

          {/* Worship Drum Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#43474f]">
              Worship Drum Style
            </label>
            <div className="flex gap-2">
              <select
                value={formData.drumStyle}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, drumStyle: e.target.value }))
                }
                className="flex-1 px-4 py-3 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]"
              >
                <option value="Modern Worship">Modern Worship</option>
                <option value="Acoustic Ballad">Acoustic Ballad</option>
                <option value="Upbeat Praise">Upbeat Praise</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (previewDrum) {
                    audioEngine.stopPreviews(); setPreviewDrum(null);
                    if (previewDrum !== formData.drumStyle) {
                      setTimeout(() => {
                        audioEngine.previewDrumStyle(formData.drumStyle);
                        setPreviewDrum(formData.drumStyle);
                        setTimeout(() => setPreviewDrum(null), 3300);
                      }, 120);
                    }
                    setPreviewPad(null);
                    return;
                  }
                  audioEngine.previewDrumStyle(formData.drumStyle);
                  setPreviewDrum(formData.drumStyle);
                  setPreviewPad(null);
                  setTimeout(() => setPreviewDrum(null), 3300);
                }}
                className={`w-12 flex-shrink-0 flex items-center justify-center rounded-xl border text-sm transition-colors cursor-pointer ${previewDrum ? 'bg-[#00305d] text-white border-[#00305d] animate-pulse' : 'bg-white border-[#c3c6d1] text-[#00305d] hover:bg-[#f2f4f6]'}`}
                title={previewDrum ? 'Detener' : 'Reproducir ejemplo'}
              >
                <span className="material-symbols-outlined text-xl">{previewDrum ? 'stop' : 'play_arrow'}</span>
              </button>
            </div>
          </div>

          {/* Save per song toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-bold text-[#00305d]">
                Ajustes por canción
              </div>
              <div className="text-[11px] text-[#737780]">
                Permitir guardar ajustes personalizados por canción
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.savePerSong}
              onChange={(e) =>
                setFormData((p) => ({ ...p, savePerSong: e.target.checked }))
              }
              className="w-5 h-5 accent-[#00305d] rounded cursor-pointer"
            />
          </div>
        </section>

        {/* Section: Apariencia */}
        <section className={`border rounded-2xl p-6 space-y-4 shadow-2xs ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#c3c6d1]/60'}`}>
          <div className={`flex items-center gap-2 font-bold text-base ${isDark ? 'text-white' : 'text-[#00305d]'}`}>
            <span className="material-symbols-outlined">palette</span>
            <h3>Apariencia</h3>
          </div>

          {/* Dark Mode Switch */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-[#191c1e]'}`}>
              <span className={`material-symbols-outlined text-lg ${isDark ? 'text-slate-400' : 'text-[#737780]'}`}>
                dark_mode
              </span>
              <span>Modo Oscuro</span>
            </div>
            <input
              type="checkbox"
              checked={formData.darkMode}
              onChange={(e) =>
                setFormData((p) => ({ ...p, darkMode: e.target.checked }))
              }
              className="w-5 h-5 accent-[#00305d] rounded cursor-pointer"
            />
          </div>

          {/* Font Size Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-[#43474f]">
              Tamaño de Letra
            </label>
            <div className="grid grid-cols-3 bg-[#f2f4f6] p-1 rounded-xl border border-[#c3c6d1]">
              {[14, 18, 22].map((sz, idx) => {
                const labels = ['A-', 'A', 'A+'];
                const isSelected = formData.fontSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, fontSize: sz }))}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-white text-[#00305d] shadow-xs'
                        : 'text-[#737780] hover:text-[#00305d]'
                    }`}
                  >
                    {labels[idx]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section: Cuenta */}
        <section className="bg-white border border-[#c3c6d1]/60 rounded-2xl p-6 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-[#00305d] font-bold text-base mb-2">
            <span className="material-symbols-outlined">manage_accounts</span>
            <h3>Cuenta</h3>
          </div>

          <div onClick={() => { if (isAdmin) { setToastMessage('Ya sos admin ✅'); setTimeout(()=>setToastMessage(null),2000); } else setShowAdminPrompt(true); }} className="p-4 bg-[#f2f4f6] rounded-xl flex items-center justify-between hover:bg-[#e6e8ea] transition-colors cursor-pointer">
            <div>
              <div className="text-xs font-bold text-[#00305d]">
                Acceso a Panel Admin {isAdmin && <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">ADMIN</span>}
              </div>
              <div className="text-[11px] text-[#737780]">
                Solo para administradores
              </div>
            </div>
            <span className="material-symbols-outlined text-lg text-[#737780]">
              chevron_right
            </span>
          </div>
          {showAdminPrompt && (
            <div className="bg-white border border-[#c3c6d1] rounded-xl p-3 space-y-2">
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Contraseña admin" className="w-full px-3 py-2.5 bg-white border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]" />
              {adminError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">{adminError}</div>}
              <div className="flex gap-2">
                <button onClick={() => { setShowAdminPrompt(false); setAdminPassword(''); setAdminError(null); }} className="flex-1 py-2 bg-white border border-[#c3c6d1] rounded-lg text-xs font-bold cursor-pointer">Cancelar</button>
                <button onClick={() => {
                  if (onAdminAccess && onAdminAccess(adminPassword)) { setShowAdminPrompt(false); setAdminPassword(''); setAdminError(null); setToastMessage('Acceso admin concedido ✅'); setTimeout(()=>setToastMessage(null),2000); }
                  else { setAdminError('Contraseña incorrecta'); }
                }} className="flex-1 py-2 bg-[#1A477A] text-white rounded-lg text-xs font-bold hover:bg-[#00305d] cursor-pointer">Entrar</button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="w-full py-3 border border-[#ba1a1a]/40 text-[#ba1a1a] rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </section>

        {/* Sticky Action Buttons */}
        <div className="space-y-2 pt-4">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-[#00305d] text-white font-bold text-sm rounded-xl shadow-md hover:bg-[#1a477a] transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            <span>Guardar Cambios</span>
          </button>

          <button
            onClick={onCancel}
            className="w-full py-3 bg-white border border-[#c3c6d1] text-[#43474f] font-bold text-sm rounded-xl hover:bg-[#f2f4f6] transition-all cursor-pointer"
          >
            Cancelar
          </button>
        </div>
          </div>
        </div>
      </main>

      {/* Profile Edit Modal - lápiz cambia nombre y foto */}
      {isProfileEditOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-[#00305d] text-center">Editar perfil</h3>
            <div className="flex flex-col items-center gap-3">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1a477a] text-white flex items-center justify-center text-xl font-bold">
                  {editName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <label className="text-xs font-semibold text-[#00305d] border border-dashed border-[#00305d] rounded-full px-4 py-2 cursor-pointer hover:bg-[#f2f4f6]">
                Cambiar foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setPhotoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {photoPreview && (
                <button onClick={() => setPhotoPreview(null)} className="text-xs text-[#ba1a1a] hover:underline">
                  Quitar foto
                </button>
              )}
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-[#43474f]">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 border border-[#c3c6d1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ED5B6]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsProfileEditOpen(false)}
                className="flex-1 py-3 bg-white border border-[#c3c6d1] rounded-xl text-sm font-bold text-[#43474f] hover:bg-[#f2f4f6]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const trimmed = editName.trim() || formData.name;
                  setFormData((p) => ({ ...p, name: trimmed, photoUrl: photoPreview || undefined }));
                  setIsProfileEditOpen(false);
                  setToastMessage('¡Perfil actualizado! Guarda cambios para conservarlo');
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="flex-1 py-3 bg-[#00305d] text-white rounded-xl text-sm font-bold hover:bg-[#1a477a]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#00305d] text-white px-6 py-3 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 z-50 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-lg text-[#3ED5B6]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
