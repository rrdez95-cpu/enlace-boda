'use client'

import './descarga-sitting.css'
import { useEffect, useMemo, useState } from 'react'
import type { BodaData } from '@/lib/types'
import { slugCodigo } from '@/lib/invitacion'
import { PLANTILLAS } from './plantillas'
import { imagenTarjeta, mesasConInvitados, pdfTarjetas } from './render-mesas'

type Props = {
  data: BodaData
  isPremium: boolean
  onPaywall: () => void
  onClose: () => void
}

export default function DescargaSitting({ data, isPremium, onPaywall, onClose }: Props) {
  const [plantillaId, setPlantillaId] = useState(PLANTILLAS[0].id)
  const [conApellido, setConApellido] = useState(false)
  const [idx, setIdx] = useState(0)
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({})
  const [vista, setVista] = useState('')
  const [generando, setGenerando] = useState(false)

  const mesas = useMemo(() => mesasConInvitados(data, conApellido), [data, conApellido])
  const plantilla = PLANTILLAS.find(p => p.id === plantillaId) || PLANTILLAS[0]
  const actual = mesas[Math.min(idx, Math.max(mesas.length - 1, 0))]
  const sinSentar = data.mesas.length - mesas.length

  // Miniaturas de las 8 plantillas con la primera mesa
  useEffect(() => {
    if (!mesas.length) return
    let vivo = true
    ;(async () => {
      const res: Record<string, string> = {}
      for (const p of PLANTILLAS) {
        res[p.id] = await imagenTarjeta(p, mesas[0], 220)
        if (!vivo) return
      }
      setMiniaturas(res)
    })()
    return () => { vivo = false }
  }, [mesas])

  // Vista grande de la mesa elegida
  useEffect(() => {
    if (!actual) { setVista(''); return }
    let vivo = true
    imagenTarjeta(plantilla, actual, 700).then(url => { if (vivo) setVista(url) })
    return () => { vivo = false }
  }, [plantilla, actual])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  async function descargar() {
    if (!isPremium) { onPaywall(); return }
    setGenerando(true)
    try {
      const pdf = await pdfTarjetas(plantilla, mesas)
      const url = URL.createObjectURL(pdf)
      const a = document.createElement('a')
      const base = data.resumen?.novios ? slugCodigo(data.resumen.novios, data.resumen.fecha) : 'boda'
      a.href = url
      a.download = `mesas-${plantilla.id}-${base}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="ds-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ds-box" role="dialog" aria-modal="true" aria-labelledby="ds-title">
        <div className="ds-head">
          <h2 id="ds-title">Tarjetas de mesa</h2>
          <button className="ds-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {!mesas.length ? (
          <p className="ds-empty">
            Todavía no hay invitados sentados. Ve a <b>Mesas</b>, crea las mesas y arrastra a cada invitado a la suya para ver aquí sus tarjetas.
          </p>
        ) : (
          <div className="ds-body">
            <div className="ds-opts">
              <div className="ds-label">Elige el diseño</div>
              <div className="ds-grid">
                {PLANTILLAS.map(p => (
                  <button key={p.id} type="button" className="ds-tpl" aria-pressed={plantillaId === p.id}
                    onClick={() => setPlantillaId(p.id)}>
                    {miniaturas[p.id]
                      ? <img src={miniaturas[p.id]} alt="" />
                      : <span className="ds-tpl-ph" style={{ background: p.fondo }} />}
                    <span>{p.nombre}</span>
                  </button>
                ))}
              </div>

              <div className="ds-label">Nombres</div>
              <div className="ds-seg" role="group" aria-label="Cómo aparecen los nombres">
                <button aria-pressed={!conApellido} onClick={() => setConApellido(false)}>Solo el nombre</button>
                <button aria-pressed={conApellido} onClick={() => setConApellido(true)}>Nombre y apellido</button>
              </div>

              <p className="ds-meta">
                Una tarjeta por mesa, tamaño A5 vertical. {mesas.length} {mesas.length === 1 ? 'mesa' : 'mesas'} con invitados
                {sinSentar > 0 ? ` (${sinSentar} sin nadie sentado no se incluyen)` : ''}.
              </p>

              <button className="ds-btn" onClick={descargar} disabled={generando}>
                {generando ? 'Preparando el PDF…' : isPremium ? 'Descargar PDF' : 'Desbloquear con Premium · 9,99 €'}
              </button>
              {!isPremium && <p className="ds-meta">Prueba todos los diseños con tus mesas antes de decidir.</p>}
            </div>

            <div className="ds-preview">
              <div className="ds-card">
                {vista ? <img src={vista} alt={`Tarjeta de la mesa ${actual?.num}`} /> : <span className="ds-loading">Preparando…</span>}
              </div>
              {mesas.length > 1 && (
                <div className="ds-nav">
                  <button onClick={() => setIdx(i => (i - 1 + mesas.length) % mesas.length)} aria-label="Mesa anterior">‹</button>
                  <span>Mesa {actual?.num} · {Math.min(idx, mesas.length - 1) + 1} de {mesas.length}</span>
                  <button onClick={() => setIdx(i => (i + 1) % mesas.length)} aria-label="Mesa siguiente">›</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
