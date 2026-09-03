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
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden relative font-sans border border-[#c3c6d1] shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,48,93,0.06)]">
      {/* Círculo menú oculto en P1 por spec */}

      <main className="w-full max-w-[440px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo & Greeting Section */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-full bg-[#1a477a] text-white shadow-lg transform transition-transform hover:scale-105 duration-300 border-2 border-white/40">
            <span className="material-symbols-outlined text-4xl">waves</span>
          </div>
          <h1 className="text-3xl font-bold text-[#00305d] mb-1">
            Bienvenidos al rio
          </h1>
        </header>

        {/* Login Card */}
        <div className="bg-white border border-[#c3c6d1]/60 rounded-2xl p-8 shadow-xs transition-all duration-300 hover:shadow-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Input */}
            <div className="space-y-2">
              <label
                className="font-semibold text-sm text-[#191c1e]"
                htmlFor="username"
              >
                Usuario o Correo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#737780] group-focus-within:text-[#006b59] transition-colors">
                  <span className="material-symbols-outlined text-xl">person</span>
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#737780] rounded-xl text-sm focus:outline-none focus:border-[#3ED5B6] focus:ring-4 focus:ring-[#3ED5B6]/15 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="font-semibold text-sm text-[#191c1e]"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs font-medium text-[#006b59] hover:underline transition-all"
                >
                  Olvidé mi contraseña
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#737780] group-focus-within:text-[#006b59] transition-colors">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-white border border-[#737780] rounded-xl text-sm focus:outline-none focus:border-[#3ED5B6] focus:ring-4 focus:ring-[#3ED5B6]/15 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#737780] hover:text-[#191c1e]"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#1a477a] text-white font-bold text-sm rounded-xl shadow-xs hover:bg-[#00305d] hover:shadow-md active:scale-98 transition-all duration-200 cursor-pointer disabled:opacity-75"
            >
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-[#c3c6d1]" />
            <span className="flex-shrink mx-4 text-[11px] font-bold text-[#43474f] bg-white px-2 uppercase tracking-widest">
              O continúa con
            </span>
            <div className="flex-grow border-t border-[#c3c6d1]" />
          </div>

          {/* Social Login Button */}
          <button
            type="button"
            onClick={onLoginSuccess}
            className="w-full flex items-center justify-center gap-3 py-3 border border-[#c3c6d1] bg-white text-[#191c1e] font-semibold text-sm rounded-xl hover:bg-[#f2f4f6] active:scale-98 transition-all duration-150 cursor-pointer shadow-2xs"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.711c-.18-.54-.282-1.117-.282-1.711s.102-1.171.282-1.711V4.957H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.043l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.957l3.007 2.332c.708-2.127 2.692-3.711 5.036-3.711z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        {/* Registration Call to Action */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-[#43474f]">
            ¿No tienes una cuenta?{' '}
            <button
              onClick={onLoginSuccess}
              className="font-bold text-[#006b59] ml-1 hover:underline cursor-pointer"
            >
              Regístrate aquí
            </button>
          </p>
        </footer>
      </main>

      {/* Decorative Illustration Element */}
      <div className="fixed bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none -z-10 translate-x-1/4 translate-y-1/4">
        <span className="material-symbols-outlined text-[300px] text-[#00305d]">
          water_drop
        </span>
      </div>
    </div>
  );
};
