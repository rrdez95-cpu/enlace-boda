'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useBoda } from '@/lib/use-boda'
import TabMesas from './tab-mesas'
import TabPlano from './tab-plano'
import TabCrono from './tab-crono'
import TabResumen from './tab-resumen'
import Paywall from './paywall'

const FREE_GUESTS = 30
const FREE_MOMENTS = 5

export default function EnlaceApp({
  userId, userName, isPro,
}: { userId: string; userName: string; isPro: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const { data, setData, loading, saving } = useBoda(userId)

  const [tab, setTab] = useState<'mesas' | 'plano' | 'crono' | 'resumen'>('mesas')
  const [paywall, setPaywall] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  function goTab(t: typeof tab) {
    // Solo el plano está bloqueado por completo.
    // El resumen se abre siempre (fecha gratis, resto bloqueado dentro).
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
          Cargando tu boda...
        </div>
      </div>
    )
  }

  const paidGuests = data.guests.filter(g => g.paid === 'si')
  const totalRecaudado = paidGuests.reduce((s, g) => s + (parseFloat(g.importe) || 0), 0)
  const checkDone = data.checklist.filter(c => c.done).length
  const checkPct = data.checklist.length ? Math.round(checkDone / data.checklist.length * 100) : 0

  // Contador de días
  let diasTexto = '— días para la boda'
  const fechaBoda = data.resumen?.fecha
  if (fechaBoda) {
    const d = new Date(fechaBoda)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d.getTime() - hoy.getTime()) / 86400000)
    diasTexto = diff > 0
      ? `${diff} ${diff === 1 ? 'día' : 'días'} para la boda`
      : diff === 0
        ? '¡HOY ES EL DÍA!'
        : 'Boda celebrada'
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">EN<span>·</span>LACE</div>
        <div className="header-stats">
          <Stat val={data.guests.length} label="Invitados" />
          <Stat val={data.mesas.length} label="Mesas" />
          <Stat val={paidGuests.length} label="Han pagado" />
          <Stat val={`${totalRecaudado.toLocaleString('es-ES')} €`} label="Recaudado" />
          <Stat val={`${checkPct}%`} label="Checklist" />
        </div>
        <div className="header-right">
          <span className="header-date">{diasTexto}</span>
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
        <TabPlano
          data={data}
          setData={setData}
          showToast={showToast}
        />
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

      {paywall && <Paywall onClose={() => setPaywall(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Stat({ val, label }: { val: string | number; label: string }) {
  return (
    <div className="hstat">
      <div className="hstat-val">{val}</div>
      <div className="hstat-key">{label}</div>
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