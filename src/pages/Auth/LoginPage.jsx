import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (v) => {
    setError('');
    setLoading(true);
    try {
      await login(v.email, v.password); // valida admin@gmail.com / admin
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full grid place-items-center bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(124,58,237,0.25),transparent_40%),radial-gradient(1200px_600px_at_90%_90%,rgba(34,211,238,0.25),transparent_40%),linear-gradient(120deg,#0f172a,#1e293b)] text-zinc-200">
      {/* halos suaves */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-75 [filter:blur(20px)] 
                      bg-[radial-gradient(800px_300px_at_80%_0%,rgba(124,58,237,0.15),transparent_40%),radial-gradient(800px_300px_at_0%_100%,rgba(34,211,238,0.15),transparent_40%)]" />

      <div className="relative w-[min(92vw,420px)] rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_40px_rgba(0,0,0,0.35)] p-7">
       {/* Brand */}
        <div className="mb-2 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/80 overflow-hidden">
            {/* usa el .ico que tienes en public/ */}
            <img
              src={`${process.env.PUBLIC_URL}/favicon.ico`} // también vale "/favicon.ico"
              alt="Bookitauto"
              className="h-7 w-7 object-contain"
              draggable="false"
            />
          </div>
          <div>
            <h1 className="m-0 text-xl font-semibold tracking-wide">Bookitauto</h1>
            <p className="m-0 text-xs text-slate-400">Panel de gestión</p>
          </div>
        </div>


        {/* Form */}
        <form className="mt-2 grid gap-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">
              {error}
            </div>
          )}

          {/* Email */}
          <label className="grid gap-1.5">
            <span className="text-xs text-slate-400">Email</span>
            <div className="grid grid-cols-[20px_1fr_28px] items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 py-2">
              <span className="grid place-items-center text-slate-400" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v1.2l10 5.8 10-5.8V6a2 2 0 0 0-2-2Zm0 5.25-8.6 5a1 1 0 0 1-1 0L4 9.25V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.25Z"/>
                </svg>
              </span>
              <input
                type="email"
                placeholder="admin@gmail.com"
                autoComplete="email"
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-slate-400 outline-none"
                {...register('email', { required: true })}
                defaultValue="admin@gmail.com"
              />
              <span />
            </div>
          </label>

          {/* Password */}
          <label className="grid gap-1.5">
            <span className="text-xs text-slate-400">Contraseña</span>
            <div className="grid grid-cols-[20px_1fr_28px] items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 py-2">
              <span className="grid place-items-center text-slate-400" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 0 1 6 0v3H9Z"/>
                </svg>
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="admin"
                autoComplete="current-password"
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-slate-400 outline-none"
                {...register('password', { required: true })}
                defaultValue="admin"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="grid place-items-center text-slate-400 hover:text-zinc-200 transition"
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPw ? (
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/><circle cx="12" cy="12" r="3" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M3 4.3 4.3 3l17 17L20 21.3l-3-3A13.3 13.3 0 0 1 12 19c-7 0-10-7-10-7a18 18 0 0 1 5.7-6.6L3 4.3ZM12 7a5 5 0 0 1 5 5c0 .7-.1 1.3-.3 1.9l-6.6-6.6c.6-.2 1.2-.3 1.9-.3Zm-7 5s2.4 4.7 7 4.7a9.6 9.6 0 0 0 3.5-.7l-1.8-1.8c-.5.2-1.1.3-1.7.3a3.5 3.5 0 0 1-3.5-3.5c0-.6.1-1.2.3-1.7L8 7.5A13.8 13.8 0 0 0 5 9.2C3.9 10 3.1 10.9 2.6 12Z"/>
                  </svg>
                )}
              </button>
            </div>
          </label>

          {/* Extras */}
          <div className="mt-0.5 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" defaultChecked className="size-3.5 rounded border-white/20 bg-white/10" />
              <span>Recordarme</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Recuperar contraseña (pendiente)')}
              className="text-xs text-cyan-200 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Submit */}
          <button
            className="mt-1 w-full rounded-xl bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] px-4 py-3 font-semibold tracking-wide text-[#ffffff] transition 
                       active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="mt-1 text-center text-xs text-slate-400">
            Demo: <code>admin@gmail.com / admin</code>
          </div>
        </form>

        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Bookitauto</span>
          <span>v0.1</span>
        </div>
      </div>
    </div>
  );
}
