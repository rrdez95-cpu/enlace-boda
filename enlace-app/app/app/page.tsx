'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: nombre } },
      })
      if (error) setMsg(error.message)
      else setMsg('Revisa tu correo para confirmar la cuenta.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg('Email o contraseña incorrectos.')
      else router.push('/app')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f4ed', padding: 20, fontFamily: 'Barlow, sans-serif'
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16,
        border: '1px solid #d8cfc2', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,.08)'
      }}>
        <div style={{
          background: '#1c1c1e', padding: '32px 28px 24px', textAlign: 'center',
          borderBottom: '1px solid #b8965a'
        }}>
          <div style={{
            fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600,
            letterSpacing: 4, color: '#e8cfa0', textTransform: 'uppercase'
          }}>
            EN<span style={{ color: '#b8965a', fontStyle: 'italic' }}>·</span>LACE
          </div>
          <div style={{ fontSize: 13, color: '#b5a898', marginTop: 8 }}>
            {mode === 'login' ? 'Accede a tu boda' : 'Crea tu cuenta gratis'}
          </div>
        </div>

        <div style={{ padding: 28 }}>
          <button onClick={handleGoogle} disabled={loading} style={btnOAuth}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Continuar con Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#d8cfc2' }} />
            <span style={{ fontSize: 11, color: '#8a7d6e', letterSpacing: 1 }}>O CON EMAIL</span>
            <div style={{ flex: 1, height: 1, background: '#d8cfc2' }} />
          </div>

          <form onSubmit={handleEmailAuth}>
            {mode === 'signup' && (
              <input
                type="text" placeholder="Tu nombre" value={nombre}
                onChange={(e) => setNombre(e.target.value)} style={inputStyle} required
              />
            )}
            <input
              type="email" placeholder="tu@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} style={inputStyle} required
            />
            <input
              type="password" placeholder="Contraseña" value={password}
              onChange={(e) => setPassword(e.target.value)} style={inputStyle}
              required minLength={6}
            />
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          {msg && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 6, fontSize: 13,
              background: 'rgba(184,150,90,.1)', color: '#8b6a2a',
              border: '1px solid rgba(184,150,90,.3)'
            }}>
              {msg}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#8a7d6e' }}>
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <span
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg('') }}
              style={{ color: '#b8965a', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', marginBottom: 10,
  border: '1px solid #d8cfc2', borderRadius: 8, fontSize: 14,
  fontFamily: 'Barlow, sans-serif', outline: 'none', background: '#f8f4ed',
}

const btnPrimary: React.CSSProperties = {
  width: '100%', padding: 14, background: '#b8965a', color: '#1c1c1e',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
  letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer',
  fontFamily: 'Barlow Condensed, sans-serif', marginTop: 4,
}

const btnOAuth: React.CSSProperties = {
  width: '100%', padding: 12, background: '#fff', color: '#1c1c1e',
  border: '1px solid #d8cfc2', borderRadius: 8, fontSize: 14, fontWeight: 500,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 10, fontFamily: 'Barlow, sans-serif',
}