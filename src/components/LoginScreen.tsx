import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateRegister?: () => void;
  onOpenMenu?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
}: Omit<LoginScreenProps, 'onOpenMenu'>) => {
  const [username, setUsername] = useState('ejemplo@correo.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1200);
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
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#737780] rounded-xl text-sm focus:outline-none focus:border-[#3ED5B6] focus:ring-4 focus:ring-[#3ED5B6]/15 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs sm:text-sm text-[#191c1e]" htmlFor="password">
                  Contraseña
                </label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-medium text-[#006b59] hover:underline">
                  Olvidé mi contraseña
                </a>
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#737780] rounded-xl text-sm focus:outline-none focus:border-[#3ED5B6] focus:ring-4 focus:ring-[#3ED5B6]/15 font-medium"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737780] hover:text-[#191c1e]">
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#1a477a] text-white font-bold text-sm rounded-xl shadow-xs hover:bg-[#00305d] active:scale-98 transition-all cursor-pointer disabled:opacity-75 min-h-[44px]">
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="relative flex items-center py-3 sm:py-4">
            <div className="flex-grow border-t border-[#c3c6d1]" />
            <span className="flex-shrink mx-3 text-[10px] font-bold text-[#43474f] bg-white px-2 uppercase tracking-widest">O continúa con</span>
            <div className="flex-grow border-t border-[#c3c6d1]" />
          </div>

          <button type="button" onClick={onLoginSuccess} className="w-full flex items-center justify-center gap-3 py-2.5 border border-[#c3c6d1] bg-white text-[#191c1e] font-semibold text-sm rounded-xl hover:bg-[#f2f4f6] active:scale-98 cursor-pointer min-h-[44px]">
            <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.711c-.18-.54-.282-1.117-.282-1.711s.102-1.171.282-1.711V4.957H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.043l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.957l3.007 2.332c.708-2.127 2.692-3.711 5.036-3.711z"/></svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        <footer className="text-center shrink-0 py-1">
          <p className="text-xs sm:text-sm text-[#43474f]">
            ¿No tienes una cuenta? <button onClick={onLoginSuccess} className="font-bold text-[#006b59] ml-1 hover:underline cursor-pointer">Regístrate aquí</button>
          </p>
        </footer>
      </main>

      <div className="fixed bottom-0 right-0 w-48 h-48 opacity-10 pointer-events-none -z-10 translate-x-1/4 translate-y-1/4 hidden sm:block">
        <span className="material-symbols-outlined text-[200px] text-[#00305d]">water_drop</span>
      </div>
    </div>
  );
};
