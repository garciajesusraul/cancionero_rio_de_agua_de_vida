import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
  onNavigateRegister?: () => void;
  onOpenMenu?: () => void;
}

export const ADMIN_EMAIL = 'cancionerorav@gmail.com';
const VALID_USER = ADMIN_EMAIL;
const VALID_PASS = '4321';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
}: Omit<LoginScreenProps, 'onOpenMenu'>) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const u = username.trim().toLowerCase();
    const p = password.trim();
    setIsLoading(true);
    try {
      // Si Supabase está configurado, intenta auth real primero
      if (supabase) {
        const { error: sbError } = await supabase.auth.signInWithPassword({ email: u, password: p });
        if (!sbError) {
          try { localStorage.setItem('rav_auth', '1'); localStorage.setItem('rav_auth_email', u); } catch {}
          onLoginSuccess(u);
          return;
        }
        // Si falla en Supabase pero credenciales son las hardcoded, permite fallback (para transición)
        if (u === VALID_USER && p === VALID_PASS) {
          console.warn('Supabase login falló, usando fallback local:', sbError?.message);
          try { localStorage.setItem('rav_auth', '1'); localStorage.setItem('rav_auth_email', u); } catch {}
          onLoginSuccess(u);
          return;
        }
        setError(sbError?.message || 'Usuario o contraseña incorrectos');
        return;
      }
      // Fallback sin Supabase (modo actual)
      if (u !== VALID_USER || p !== VALID_PASS) {
        setError('Usuario o contraseña incorrectos');
        return;
      }
      try { localStorage.setItem('rav_auth', '1'); localStorage.setItem('rav_auth_email', u); } catch {}
      onLoginSuccess(u);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f7f9fb] flex flex-col items-center justify-center px-4 sm:px-6 py-3 sm:py-4 font-sans relative border border-[#c3c6d1] shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,48,93,0.06)]">
      <main className="w-full max-w-[440px] sm:max-w-md md:max-w-lg lg:max-w-[520px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col justify-center max-h-full gap-3 sm:gap-4">
        {/* Logo & Greeting - compacto para entrar en altura */}
        <header className="text-center shrink-0">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-16 lg:h-16 rounded-full bg-[#1a477a] text-white shadow-lg border-2 border-white/40">
            <span className="material-symbols-outlined text-2xl sm:text-3xl">waves</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#00305d] mt-2 leading-tight">
            Bienvenidos al rio
          </h1>
          <p className="text-xs text-[#737780] mt-1">Acceso exclusivo #RAV</p>
        </header>

        {/* Login Card - compacto */}
        <div className="bg-white border border-[#c3c6d1]/60 rounded-2xl p-5 sm:p-6 shadow-xs shrink-0">
          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="font-semibold text-xs sm:text-sm text-[#191c1e]" htmlFor="username">
                Usuario o Correo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737780] group-focus-within:text-[#006b59]">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cancionerorav@gmail.com"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#737780] rounded-xl text-sm focus:outline-none focus:border-[#3ED5B6] focus:ring-4 focus:ring-[#3ED5B6]/15 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs sm:text-sm text-[#191c1e]" htmlFor="password">
                  Contraseña
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737780] group-focus-within:text-[#006b59]">
                  <span className="material-symbols-outlined text-lg">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#737780] rounded-xl text-sm focus:outline-none focus:border-[#3ED5B6] focus:ring-4 focus:ring-[#3ED5B6]/15 font-medium"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737780] hover:text-[#191c1e]">
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-3 py-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#1a477a] text-white font-bold text-sm rounded-xl shadow-xs hover:bg-[#00305d] active:scale-98 transition-all cursor-pointer disabled:opacity-75 min-h-[44px]">
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

        </div>

      </main>

      <div className="fixed bottom-0 right-0 w-48 h-48 opacity-10 pointer-events-none -z-10 translate-x-1/4 translate-y-1/4 hidden sm:block">
        <span className="material-symbols-outlined text-[200px] text-[#00305d]">water_drop</span>
      </div>
    </div>
  );
};
