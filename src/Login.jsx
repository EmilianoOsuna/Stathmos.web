import { useState } from 'react'
import { supabase } from './supabaseClient'

const inputCls = "w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2.5 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 placeholder-neutral-600 transition-colors"

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin() {
    if (!email || !password) return setError('Ingresa tu correo y contraseña')
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
    // Si el login es exitoso, onAuthStateChange en App.jsx detecta la sesión automáticamente
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      {/* Background grid texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black uppercase tracking-widest text-amber-500">Stathmos</h1>
          <p className="font-mono text-xs text-neutral-600 tracking-widest mt-1">// Sistema de Gestión de Taller</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 border-t-2 border-t-amber-500 rounded-lg p-7 shadow-2xl">
          <h2 className="text-lg font-bold uppercase tracking-wide text-neutral-100 mb-5">Iniciar Sesión</h2>

          <div className="mb-4">
            <label className="block font-mono text-[0.65rem] text-neutral-500 uppercase tracking-widest mb-1.5">
              Correo electrónico
            </label>
            <input
              className={inputCls}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="email"
            />
          </div>

          <div className="mb-5">
            <label className="block font-mono text-[0.65rem] text-neutral-500 uppercase tracking-widest mb-1.5">
              Contraseña
            </label>
            <input
              className={inputCls}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm uppercase tracking-wide rounded transition-colors cursor-pointer">
            {loading
              ? <><SpinIcon /> Verificando…</>
              : 'Entrar'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center font-mono text-[0.6rem] text-neutral-700 mt-6 tracking-widest">
          KENTRO SOFTWARE · STATHMOS v2.0
        </p>
      </div>
    </div>
  )
}

function SpinIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}