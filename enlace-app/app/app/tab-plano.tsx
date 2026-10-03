'use client'

import './tab-plano.css'
import { useRef, useState, useEffect, useCallback } from 'react'
import { BodaData, Mesa } from '@/lib/types'
import { geometria, SEAT_R } from '@/lib/plano-geometria'
import DescargaSitting from '../_components/sitting/descarga-sitting'

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  showToast: (m: string) => void
  isPremium: boolean
  onPaywall: () => void
}

type Forma = Mesa['shape']

const FORMAS: { id: Forma; label: string }[] = [
  { id: 'round', label: 'Redonda' },
  { id: 'square', label: 'Cuadrada' },
  { id: 'rect', label: 'Rectangular' },
]

export default function TabPlano({ data, setData, showToast, isPremium, onPaywall }: Props) {
  const vpRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.45)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selId, setSelId] = useState<number | null>(null)
  const [descarga, setDescarga] = useState(false)
  const panning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const dragMesa = useRef<{ id: number; offX: number; offY: number } | null>(null)

  const sel = data.mesas.find(m => m.id === selId) || null
  const selIdx = sel ? data.mesas.findIndex(m => m.id === sel.id) : -1

  const resetZoom = useCallback(() => {
    const vp = vpRef.current
    if (!vp) return
    const z = Math.min(vp.clientWidth / 2400, vp.clientHeight / 1600) * 0.9
    setZoom(z)
    setPan({ x: (vp.clientWidth - 2400 * z) / 2, y: (vp.clientHeight - 1600 * z) / 2 })
  }, [])

  useEffect(() => {
    const t = setTimeout(resetZoom, 100)
    return () => clearTimeout(t)
  }, [resetZoom])

  function updateMesa(id: number, patch: Partial<Mesa>) {
    setData(d => ({ ...d, mesas: d.mesas.map(m => (m.id === id ? { ...m, ...patch } : m)) }))
  }

  function autoLayout() {
    const cols = Math.ceil(Math.sqrt(data.mesas.length)) || 1
    setData(d => ({
      ...d,
      mesas: d.mesas.map((m, i) => ({ ...m, x: 220 + (i % cols) * 260, y: 150 + Math.floor(i / cols) * 240 })),
    }))
    showToast('Distribución automática aplicada')
  }

  function formaDeTodas(shape: Forma) {
    setData(d => ({ ...d, mesas: d.mesas.map(m => ({ ...m, shape })) }))
    showToast(`Todas las mesas: ${FORMAS.find(f => f.id === shape)?.label.toLowerCase()}`)
  }

  // Arrastrar mesas y mover el plano (ratón y dedo)
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragMesa.current) {
        const vp = vpRef.current
        if (!vp) return
        const r = vp.getBoundingClientRect()
        const { id, offX, offY } = dragMesa.current
        updateMesa(id, {
          x: Math.round((e.clientX - r.left - pan.x) / zoom - offX),
          y: Math.round((e.clientY - r.top - pan.y) / zoom - offY),
        })
        return
      }
      if (panning.current) setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
    }
    function onUp() {
      dragMesa.current = null
      panning.current = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [pan, zoom])

  function onWheel(e: React.WheelEvent) {
    const d = e.deltaY > 0 ? 0.9 : 1.1
    const vp = vpRef.current
    if (!vp) return
    const r = vp.getBoundingClientRect()
    const mx = e.clientX - r.left, my = e.clientY - r.top
    setPan(p => ({ x: mx - (mx - p.x) * d, y: my - (my - p.y) * d }))
    setZoom(z => Math.max(0.1, Math.min(3, z * d)))
  }

  function empezarArrastre(e: React.PointerEvent, m: Mesa) {
    e.stopPropagation()
    setSelId(m.id)
    const el = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    dragMesa.current = { id: m.id, offX: (e.clientX - el.left) / zoom, offY: (e.clientY - el.top) / zoom }
  }

  return (
    <div className="plano-wrap">
      <div className="plano-toolbar">
        <span className="plano-toolbar-title">Plano del salón</span>
        <div className="toolbar-sep" />
        <button className="tool-btn" onClick={autoLayout}>⟳ Distribución automática</button>
        <button className="tool-btn" onClick={() => setZoom(z => Math.min(z * 1.2, 3))}>+ Acercar</button>
        <button className="tool-btn" onClick={() => setZoom(z => Math.max(z / 1.2, 0.1))}>− Alejar</button>
        <button className="tool-btn" onClick={resetZoom}>⊡ Encuadrar</button>
        <div className="toolbar-sep" />
        <span className="plano-toolbar-label">Todas:</span>
        {FORMAS.map(f => (
          <button key={f.id} className="tool-btn" onClick={() => formaDeTodas(f.id)} title={`Poner todas las mesas ${f.label.toLowerCase()}s`}>
            <span className={`forma-ico ${f.id}`} />{f.label}
          </button>
        ))}
        <div className="toolbar-sep" />
        <button className="tool-btn tool-btn-gold" onClick={() => setDescarga(true)}>
          ⬇ Tarjetas de mesa {!isPremium && <span className="tab-lock">🔒</span>}
        </button>
      </div>

      <div className="plano-viewport" ref={vpRef}
        style={{ touchAction: 'none' }}
        onWheel={onWheel}
        onPointerDown={e => {
          if (dragMesa.current) return
          setSelId(null)
          panning.current = true
          panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
        }}>
        <div className="plano-canvas" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
          <div className="room-outline">
            <div className="room-label">SALÓN DE CELEBRACIONES</div>
            <div className="dim-h"><div className="dim-h-label">ANCHO DEL SALÓN</div></div>
            <div className="dim-v"><div className="dim-v-label">LARGO DEL SALÓN</div></div>
          </div>

          {data.mesas.map((m, idx) => {
            const g = geometria(m)
            const ocupados = data.guests.filter(x => x.mesaId === m.id).length
            return (
              <div key={m.id} className={`canvas-mesa ${selId === m.id ? 'sel' : ''}`}
                style={{ left: m.x, top: m.y, width: g.w, height: g.h }}>
                {g.seats.map((s, i) => (
                  <div key={i} className={`cm-seat ${i < ocupados ? 'occupied' : ''}`}
                    style={{ left: s.x - SEAT_R, top: s.y - SEAT_R, width: SEAT_R * 2, height: SEAT_R * 2 }} />
                ))}
                <div className={`cm-body ${m.shape === 'round' ? 'round' : 'rect'}`}
                  style={{ left: g.table.x, top: g.table.y, width: g.table.w, height: g.table.h }}
                  onPointerDown={e => empezarArrastre(e, m)}>
                  <div className="cm-number">Mesa {idx + 1}</div>
                  <div className="cm-name">{m.nombre}</div>
                  <div className="cm-count">{ocupados}/{m.cap}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mesa seleccionada: cambiar su forma */}
        {sel && (
          <div className="mesa-panel" onPointerDown={e => e.stopPropagation()}>
            <div className="mesa-panel-h">
              <div>
                <b>Mesa {selIdx + 1}{sel.nombre ? ` · ${sel.nombre}` : ''}</b>
                <span>{data.guests.filter(x => x.mesaId === sel.id).length} de {sel.cap} sitios ocupados</span>
              </div>
              <button className="mesa-panel-x" onClick={() => setSelId(null)} aria-label="Cerrar">×</button>
            </div>
            <div className="mesa-formas" role="group" aria-label="Forma de la mesa">
              {FORMAS.map(f => (
                <button key={f.id} aria-pressed={sel.shape === f.id} onClick={() => updateMesa(sel.id, { shape: f.id })}>
                  <span className={`forma-ico ${f.id}`} />{f.label}
                </button>
              ))}
            </div>
            {sel.shape === 'rect' && (
              <button className="mesa-girar" onClick={() => updateMesa(sel.id, { rot: sel.rot === 90 ? 0 : 90 })}>
                ↻ Girar {sel.rot === 90 ? 'a horizontal' : 'a vertical'}
              </button>
            )}
          </div>
        )}

        <div className="plano-controls">
          <div className="plano-ctrl-group">
            <button className="pc-btn" onClick={() => setZoom(z => Math.min(z * 1.2, 3))}>+</button>
            <button className="pc-btn" onClick={() => setZoom(z => Math.max(z / 1.2, 0.1))}>−</button>
          </div>
          <div className="plano-ctrl-group">
            <button className="pc-btn" onClick={resetZoom}>⊡</button>
          </div>
        </div>

        <div className="plano-legend">
          <div className="legend-title">LEYENDA</div>
          <div className="legend-item"><div className="legend-swatch round" />Mesa redonda</div>
          <div className="legend-item"><div className="legend-swatch square" />Mesa cuadrada</div>
          <div className="legend-item"><div className="legend-swatch" />Mesa rectangular</div>
          <div className="legend-item" style={{ marginTop: 7, borderTop: '1px solid var(--border)', paddingTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--charcoal3)', flexShrink: 0 }} />
            Asiento ocupado
          </div>
          <div className="legend-item">
            <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--charcoal3)', background: 'var(--ivory2)', flexShrink: 0 }} />
            Asiento libre
          </div>
          <div className="legend-hint">Toca una mesa para cambiar su forma</div>
        </div>

        <div className="plano-compass">N</div>
      </div>

      {descarga && (
        <DescargaSitting data={data} isPremium={isPremium} onPaywall={() => { setDescarga(false); onPaywall() }} onClose={() => setDescarga(false)} />
      )}
    </div>
  )
}
