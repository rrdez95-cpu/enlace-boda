'use client'

import { useState, useEffect } from 'react'
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

const FREE_GUESTS = 30
const FREE_MOMENTS = 5

type Tab = 'inicio' | 'fincas' | 'mesas' | 'plano' | 'crono' | 'resumen' | 'invitaciones'

export default function EnlaceApp({
  userId, userName, isPro: initialIsPro, isPremium: initialIsPremium, bodaId,
}: {
  userId: string
  userName: string
  isPro: boolean
  isPremium: boolean
  bodaId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const { data, setData, loading, saving } = useBoda(userId)

  const [tab, setTab] = useState<Tab>('inicio')
  const [paywall, setPaywall] = useState<false | 'pro' | 'premium'>(false)
  const [toast, setToast] = useState('')
  const [isPro, setIsPro] = useState(initialIsPro)
  const [isPremium, setIsPremium] = useState(initialIsPremium)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paid = params.get('paid')
    if (!paid) return
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

  function goTab(t: Tab) {
    if (!isPro && t === 'plano') { setPaywall('pro'); return }
    // Sin bloqueo: el tab muestra overlay interno
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
          <button
            className={`plan-pill ${isPremium ? 'premium' : isPro ? 'pro' : 'free'}`}
            onClick={() => !isPro && setPaywall('pro')}>
            {isPremium ? '✦ Premium' : isPro ? '✦ Plan completo' : '✦ Gratuito'}
          </button>
          <button className="btn-logout" onClick={logout}>Salir</button>
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

      {tab === 'inicio' && (
        <TabInicio data={data} userName={userName} isPro={isPro} isPremium={isPremium}
          onPaywall={t => setPaywall(t)} onGoTab={goTab} />
      )}
      {tab === 'fincas' && (
        <TabFincas data={data} setData={setData} showToast={showToast}
          isPro={isPro} onPaywall={() => setPaywall('pro')} />
      )}
      {tab === 'mesas' && (
        <TabMesas data={data} setData={setData} isPro={isPro}
          freeLimit={FREE_GUESTS} onPaywall={() => setPaywall('pro')} showToast={showToast} />
      )}
      {tab === 'plano' && (
        <TabPlano data={data} setData={setData} showToast={showToast} />
      )}
      {tab === 'crono' && (
        <TabCrono data={data} setData={setData} isPro={isPro}
          freeLimit={FREE_MOMENTS} onPaywall={() => setPaywall('pro')} showToast={showToast} />
      )}
      {tab === 'resumen' && (
        <TabResumen data={data} setData={setData} showToast={showToast}
          isPro={isPro} onPaywall={() => setPaywall('pro')} />
      )}
      {tab === 'invitaciones' && (
        <TabInvitaciones data={data} setData={setData} showToast={showToast}
          userId={userId} bodaId={bodaId}
          isPremium={isPremium} onPaywall={() => setPaywall('premium')} />
      )}

      {paywall && (
        <Paywall
          tier={paywall}
          onClose={() => setPaywall(false)}
          userId={userId}
        />
      )}
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