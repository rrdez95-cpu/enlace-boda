'use client'

import './invitado.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useBoda } from '@/lib/use-boda'
import TabInicio from './tab-inicio'
import TabFincas from './tab-fincas'
import TabMesas from './tab-mesas'
import TabPlano from './tab-plano'
import TabCrono from './tab-crono'
import TabResumen from './tab-resumen'
import TabInvitaciones from './tab-invitaciones'
import Paywall from './paywall'
import AuthModal, { type MotivoRegistro } from '../_components/auth-modal'

const FREE_GUESTS = 30
const FREE_MOMENTS = 5
const CAMBIOS_PARA_AVISAR = 15

type Tab = 'inicio' | 'fincas' | 'mesas' | 'plano' | 'crono' | 'resumen' | 'invitaciones'

export default function EnlaceApp({
  userId, userName, userEmail, isPro: initialIsPro, isPremium: initialIsPremium, bodaId: bodaIdServidor,
}: {
  userId: string | null
  userName: string
  userEmail?: string
  isPro: boolean
  isPremium: boolean
  bodaId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const invitado = !userId
  const { data, setData, loading, saving, bodaId: bodaIdHook } = useBoda(userId)
  const bodaId = bodaIdServidor || bodaIdHook || ''

  const [tab, setTab] = useState<Tab>('inicio')
  const [paywall, setPaywall] = useState<false | 'pro' | 'premium'>(false)
  const [registro, setRegistro] = useState<MotivoRegistro | null>(null)
  const [avisoCerrado, setAvisoCerrado] = useState(true)
  const [toast, setToast] = useState('')
  const [isPro, setIsPro] = useState(initialIsPro)
  const [isPremium, setIsPremium] = useState(initialIsPremium)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }

  // Sin cuenta, los pagos y la publicación piden registrarse antes
  const abrirPago = useCallback((t: 'pro' | 'premium') => {
    if (!userId) { setRegistro('pagar'); return }
    setPaywall(t)
  }, [userId])

  const cerrarRegistro = useCallback(() => setRegistro(null), [])

  // Aviso de uso sin cuenta (se puede ocultar durante la sesión)
  useEffect(() => {
    if (!invitado) return
    try { setAvisoCerrado(sessionStorage.getItem('enlace:aviso-cerrado') === '1') } catch { setAvisoCerrado(false) }
  }, [invitado])
  function cerrarAviso() {
    setAvisoCerrado(true)
    try { sessionStorage.setItem('enlace:aviso-cerrado', '1') } catch { /* sin acceso */ }
  }

  // Tras un rato usándola sin cuenta, se le propone guardar (una vez por sesión)
  const cambios = useRef(0)
  useEffect(() => {
    if (!invitado || loading) return
    cambios.current++
    if (cambios.current !== CAMBIOS_PARA_AVISAR) return
    try {
      if (sessionStorage.getItem('enlace:propuesta-vista') === '1') return
      sessionStorage.setItem('enlace:propuesta-vista', '1')
    } catch { /* sin acceso */ }
    setRegistro(r => r || 'guardar')
  }, [data, invitado, loading])

  // Vuelta desde Stripe
  useEffect(() => {
    if (!userId) return
    const params = new URLSearchParams(window.location.search)
    if (!params.get('paid') && !params.get('premium')) return
    window.history.replaceState({}, '', window.location.pathname)
    showToast('Verificando tu pago…')
    let attempts = 0
    const timer = setInterval(async () => {
      attempts++
      const { data: profile } = await supabase
        .from('profiles').select('is_pro, is_premium').eq('id', userId).single()
      if (profile?.is_premium) {
        clearInterval(timer)
        setIsPro(true)
        setIsPremium(true)
        showToast('🎉 ¡Pago confirmado! Plan premium desbloqueado')
        router.refresh()
      } else if (profile?.is_pro) {
        clearInterval(timer)
        setIsPro(true)
        showToast('🎉 ¡Pago confirmado! Plan completo desbloqueado')
        router.refresh()
      } else if (attempts >= 10) {
        clearInterval(timer)
        showToast('El pago se está procesando. Recarga en un minuto.')
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [userId])

  // Todas las pestañas se pueden abrir: lo de pago se prueba dentro y se desbloquea desde allí
  function goTab(t: Tab) {
    setTab(t)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: 1 }}>Cargando tu boda…</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="app-logo-btn" onClick={() => setTab('inicio')}>
          <span className="app-logo">EN<span>·</span>LACE</span>
        </button>
        <div className="header-right">
          {saving && <span className="save-dot">Guardando…</span>}
          {invitado ? (
            <>
              <button className="btn-entrar" onClick={() => setRegistro('login')}>Ya tengo cuenta</button>
              <button className="btn-crear-cuenta" onClick={() => setRegistro('guardar')}>Crear cuenta gratis</button>
            </>
          ) : (
            <>
              <button
                className={`plan-pill ${isPremium ? 'premium' : isPro ? 'pro' : 'free'}`}
                onClick={() => !isPro && abrirPago('pro')}>
                {isPremium ? '✦ Premium' : isPro ? '✦ Plan completo' : '✦ Gratuito'}
              </button>
              <button className="btn-logout" onClick={logout}>Salir</button>
            </>
          )}
        </div>
      </header>

      <nav className="tab-bar">
        <TabBtn active={tab === 'inicio'} onClick={() => goTab('inicio')}>⌂ Inicio</TabBtn>
        <TabBtn active={tab === 'fincas'} onClick={() => goTab('fincas')}>🌿 Fincas</TabBtn>
        <TabBtn active={tab === 'mesas'} onClick={() => goTab('mesas')}>⬡ Mesas</TabBtn>
        <TabBtn active={tab === 'plano'} onClick={() => goTab('plano')}>
          □ Plano {!isPro && <span className="tab-lock">🔒</span>}
        </TabBtn>
        <TabBtn active={tab === 'crono'} onClick={() => goTab('crono')}>◷ Cronograma</TabBtn>
        <TabBtn active={tab === 'resumen'} onClick={() => goTab('resumen')}>✦ Resumen</TabBtn>
        <TabBtn active={tab === 'invitaciones'} onClick={() => goTab('invitaciones')}>
          💌 Invitación {!isPremium && <span className="tab-lock">🔒</span>}
        </TabBtn>
      </nav>

      {invitado && !avisoCerrado && (
        <div className="guest-bar" role="status">
          <span className="guest-bar-txt">Estás usando Enlace sin cuenta. Lo que hagas se guarda solo en este navegador.</span>
          <button className="guest-bar-btn" onClick={() => setRegistro('guardar')}>Guardar mi boda</button>
          <button className="guest-bar-x" onClick={cerrarAviso} aria-label="Ocultar aviso">×</button>
        </div>
      )}

      {tab === 'inicio' && (
        <TabInicio data={data} userName={userName} isPro={isPro} isPremium={isPremium}
          isGuest={invitado} onRegistro={() => setRegistro('guardar')}
          userId={userId} userEmail={userEmail}
          onPaywall={t => abrirPago(t)} onGoTab={goTab} />
      )}
      {tab === 'fincas' && (
        <TabFincas data={data} setData={setData} showToast={showToast}
          isPro={isPro} onPaywall={() => abrirPago('pro')} />
      )}
      {tab === 'mesas' && (
        <TabMesas data={data} setData={setData} isPro={isPro}
          freeLimit={FREE_GUESTS} onPaywall={() => abrirPago('pro')} showToast={showToast}
          isPremium={isPremium} onPaywallPremium={() => abrirPago('premium')} />
      )}
      {tab === 'plano' && (
        <TabPlano data={data} setData={setData} showToast={showToast}
          isPro={isPro} isPremium={isPremium}
          onPaywallPro={() => abrirPago('pro')} onPaywall={() => abrirPago('premium')} />
      )}
      {tab === 'crono' && (
        <TabCrono data={data} setData={setData} isPro={isPro}
          freeLimit={FREE_MOMENTS} onPaywall={() => abrirPago('pro')} showToast={showToast} />
      )}
      {tab === 'resumen' && (
        <TabResumen data={data} setData={setData} showToast={showToast}
          isPro={isPro} onPaywall={() => abrirPago('pro')} />
      )}
      {tab === 'invitaciones' && (
        <TabInvitaciones data={data} setData={setData} showToast={showToast}
          userId={userId} bodaId={bodaId} isPremium={isPremium} isGuest={invitado}
          onRegistro={() => setRegistro('publicar')} onPaywall={() => abrirPago('premium')} />
      )}

      {paywall && userId && (
        <Paywall tier={paywall} onClose={() => setPaywall(false)} userId={userId} userEmail={userEmail} />
      )}
      {registro && <AuthModal motivo={registro} onClose={cerrarRegistro} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button className={`tab-btn ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
