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
import Paywall from './paywall'

const FREE_GUESTS = 30
const FREE_MOMENTS = 5

type Tab = 'inicio' | 'fincas' | 'mesas' | 'plano' | 'crono' | 'resumen'

export default function EnlaceApp({
  userId, userName, isPro: initialIsPro,
}: { userId: string; userName: string; isPro: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const { data, setData, loading, saving } = useBoda(userId)

  const [tab, setTab] = useState<Tab>('inicio')
  const [paywall, setPaywall] = useState(false)
  const [toast, setToast] = useState('')
  const [isPro, setIsPro] = useState(initialIsPro)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  // Retorno desde Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') !== '1') return

    window.history.replaceState({}, '', window.location.pathname)
    showToast('Verificando tu pago…')

    let attempts = 0
    const timer = setInterval(async () => {
      attempts++
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', userId)
        .single()

      if (profile?.is_pro) {
        clearInterval(timer)
        setIsPro(true)
        showToast('🎉 ¡Pago confirmado! Enlace desbloqueado')
        router.refresh()
      } else if (attempts >= 10) {
        clearInterval(timer)
        showToast('El pago se está procesando. Recarga en un minuto.')
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [userId])

  function goTab(t: Tab) {
    if (!isPro && t === 'plano') { setPaywall(true); return }
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
        <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: 1 }}>
          Cargando tu boda…
        </div>
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
            className={`plan-pill ${isPro ? 'pro' : 'free'}`}
            onClick={() => !isPro && setPaywall(true)}
          >
            {isPro ? '✦ Plan completo' : '✦ Plan gratuito'}
          </button>
          <button className="btn-logout" onClick={logout}>Salir</button>
        </div>
      </header>

      <nav className="tab-bar">
        <TabBtn active={tab === 'inicio'} onClick={() => goTab('inicio')}>
          ⌂ Inicio
        </TabBtn>
        <TabBtn active={tab === 'fincas'} onClick={() => goTab('fincas')}>
          🌿 Fincas
        </TabBtn>
        <TabBtn active={tab === 'mesas'} onClick={() => goTab('mesas')}>
          ⬡ Mesas e invitados
        </TabBtn>
        <TabBtn active={tab === 'plano'} onClick={() => goTab('plano')}>
          □ Plano del salón {!isPro && <span className="tab-lock">🔒</span>}
        </TabBtn>
        <TabBtn active={tab === 'crono'} onClick={() => goTab('crono')}>
          ◷ Cronograma
        </TabBtn>
        <TabBtn active={tab === 'resumen'} onClick={() => goTab('resumen')}>
          ✦ Resumen general
        </TabBtn>
      </nav>

      {tab === 'inicio' && (
        <TabInicio
          data={data}
          userName={userName}
          isPro={isPro}
          onPaywall={() => setPaywall(true)}
          onGoTab={goTab}
        />
      )}

      {tab === 'fincas' && (
        <TabFincas
          data={data}
          setData={setData}
          showToast={showToast}
        />
      )}

      {tab === 'mesas' && (
        <TabMesas
          data={data}
          setData={setData}
          isPro={isPro}
          freeLimit={FREE_GUESTS}
          onPaywall={() => setPaywall(true)}
          showToast={showToast}
        />
      )}

      {tab === 'plano' && (
        <TabPlano data={data} setData={setData} showToast={showToast} />
      )}

      {tab === 'crono' && (
        <TabCrono
          data={data}
          setData={setData}
          isPro={isPro}
          freeLimit={FREE_MOMENTS}
          onPaywall={() => setPaywall(true)}
          showToast={showToast}
        />
      )}

      {tab === 'resumen' && (
        <TabResumen
          data={data}
          setData={setData}
          showToast={showToast}
          isPro={isPro}
          onPaywall={() => setPaywall(true)}
        />
      )}

      {paywall && <Paywall onClose={() => setPaywall(false)} userId={userId} />}
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