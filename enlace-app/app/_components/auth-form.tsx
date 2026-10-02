'use client'

import './auth.css'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

function traducir(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('already registered')) return 'Ya hay una cuenta con este email. Inicia sesión.'
  if (m.includes('at least 6')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('invalid email')) return 'Ese email no parece correcto.'
  if (m.includes('rate limit')) return 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.'
  return 'No se ha podido crear la cuenta. Inténtalo de nuevo.'
}

export default function AuthForm({ modoInicial = 'signup' }: { modoInicial?: 'login' | 'signup' }) {
  const supabase = useMemo(() => createClient(), [])
  const [modo, setModo] = useState(modoInicial)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  async function conEmail(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setMsg('')
    setOk(false)
    if (modo === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: nombre } } })
      if (error) {
        setMsg(traducir(error.message))
      } else {
        setOk(true)
        setMsg('Te hemos enviado un correo para confirmar tu cuenta. Ábrelo en este mismo dispositivo y navegador para no perder lo que ya has hecho.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMsg('El email o la contraseña no son correctos.')
      } else {
        window.location.assign('/app')
        return
      }
    }
    setCargando(false)
  }

  async function conGoogle() {
    setCargando(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="au">
      <button type="button" className="au-google" onClick={conGoogle} disabled={cargando}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
        Continuar con Google
      </button>

      <div className="au-sep">o con tu email</div>

      <form className="au-form" onSubmit={conEmail}>
        {modo === 'signup' && (
          <input className="au-in" type="text" placeholder="Tu nombre" autoComplete="given-name"
            value={nombre} onChange={e => setNombre(e.target.value)} required />
        )}
        <input className="au-in" type="email" placeholder="tu@email.com" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="au-in" type="password" minLength={6} required
          autoComplete={modo === 'signup' ? 'new-password' : 'current-password'}
          placeholder={modo === 'signup' ? 'Contraseña (mínimo 6 caracteres)' : 'Contraseña'}
          value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="au-btn" disabled={cargando}>
          {cargando ? 'Un momento…' : modo === 'signup' ? 'Crear cuenta gratis' : 'Entrar'}
        </button>
      </form>

      {msg && <p className={`au-msg ${ok ? 'ok' : ''}`} role="status">{msg}</p>}

      <p className="au-switch">
        {modo === 'signup' ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
        <button type="button" onClick={() => { setModo(modo === 'signup' ? 'login' : 'signup'); setMsg('') }}>
          {modo === 'signup' ? 'Inicia sesión' : 'Créala gratis'}
        </button>
      </p>
    </div>
  )
}
