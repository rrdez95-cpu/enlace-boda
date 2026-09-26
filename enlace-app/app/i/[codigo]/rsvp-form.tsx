'use client'

import { useState } from 'react'

type Bus = { id: number; nombre: string; hora: string }

type Props = {
  codigo: string
  bodaId: string
  buses: Bus[]
  fechaLimite?: string
}

export default function RsvpForm({ codigo, buses, fechaLimite }: Props) {
  const [nombre, setNombre] = useState('')
  const [asiste, setAsiste] = useState<boolean | null>(null)
  const [conAcomp, setConAcomp] = useState(false)
  const [nombreAcomp, setNombreAcomp] = useState('')
  const [intolerancia, setIntolerancia] = useState('')
  const [conBus, setConBus] = useState(false)
  const [rutaBus, setRutaBus] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const fechaStr = fechaLimite
    ? new Date(fechaLimite).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  function actualizarAcomp(n: string) {
    setNombre(n)
    if (conAcomp && !nombreAcomp) {
      // placeholder se actualiza visualmente, no hace falta setState
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (asiste === null) { setError('Indica si asistirás'); return }
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          nombre: nombre.trim(),
          asiste,
          nombre_acomp: conAcomp ? (nombreAcomp.trim() || `Acompañante de ${nombre.trim()}`) : undefined,
          intolerancia: intolerancia.trim() || undefined,
          necesita_bus: conBus,
          ruta_bus: conBus ? rutaBus : undefined,
        }),
      })
      if (!res.ok) throw new Error('Error al enviar')
      setEnviado(true)
    } catch {
      setError('Ha ocurrido un error. Inténtalo de nuevo.')
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 18 }}>💍</div>
        <div style={{ fontFamily: 'var(--dfont)', fontSize: 28, fontStyle: 'italic', fontWeight: 300, color: 'var(--ink)', marginBottom: 12 }}>
          {asiste ? '¡Nos alegra mucho!' : 'Lo sentimos mucho'}
        </div>
        <p style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink2)', lineHeight: 1.75 }}>
          {asiste
            ? 'Hemos recibido tu confirmación. ¡Nos vemos el gran día!'
            : 'Hemos recibido tu respuesta. ¡Os echaremos de menos!'}
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,.65)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--bradius)',
    padding: '14px 16px',
    fontFamily: 'var(--bfont)',
    fontSize: 15,
    fontWeight: 300,
    color: 'var(--ink)',
    outline: 'none',
    width: '100%',
    marginTop: 6,
    display: 'block',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--lfont)',
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 500,
    display: 'block',
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {fechaStr && (
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--ink3)' }}>
          Confirma antes del {fechaStr}
        </p>
      )}

      <div>
        <label style={labelStyle}>Tu nombre</label>
        <input style={inputStyle} type="text" value={nombre} required
          placeholder="Laura García"
          onChange={e => actualizarAcomp(e.target.value)} />
      </div>

      <div>
        <label style={labelStyle}>¿Asistirás?</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
          {[{ v: true, l: 'Allí estaré' }, { v: false, l: 'No podré ir' }].map(({ v, l }) => (
            <button key={l} type="button"
              onClick={() => setAsiste(v)}
              style={{
                padding: '16px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--bradius)',
                background: asiste === v ? 'var(--btn)' : 'rgba(255,255,255,.65)',
                fontFamily: 'var(--dfont)',
                fontSize: 17,
                fontStyle: 'italic',
                color: asiste === v ? 'var(--btnfg)' : 'var(--ink2)',
                cursor: 'pointer',
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {asiste === true && (
        <>
          {/* Acompañante toggle */}
          <div
            onClick={() => { setConAcomp(v => !v); if (conAcomp) setNombreAcomp('') }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', border: '1px solid var(--line)',
              borderRadius: 'var(--bradius)', background: 'rgba(255,255,255,.65)', cursor: 'pointer',
            }}>
            <span style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink)' }}>¿Vienes acompañado/a?</span>
            <div style={{
              width: 40, height: 22, borderRadius: 11,
              background: conAcomp ? 'var(--accent)' : 'var(--line)',
              position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', width: 16, height: 16, borderRadius: '50%',
                background: 'white', top: 3, left: conAcomp ? 21 : 3,
                transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
              }} />
            </div>
          </div>

          {conAcomp && (
            <div>
              <label style={labelStyle}>Nombre de tu acompañante</label>
              <input style={inputStyle} type="text" value={nombreAcomp}
                placeholder={nombre ? `Acompañante de ${nombre}` : 'Nombre de tu acompañante'}
                onChange={e => setNombreAcomp(e.target.value)} />
            </div>
          )}

          <div>
            <label style={labelStyle}>Alergias o intolerancias</label>
            <input style={inputStyle} type="text" value={intolerancia}
              placeholder="Gluten, lactosa… (vacío si ninguna)"
              onChange={e => setIntolerancia(e.target.value)} />
          </div>

          {buses.length > 0 && (
            <>
              <div
                onClick={() => { setConBus(v => !v); setRutaBus('') }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', border: '1px solid var(--line)',
                  borderRadius: 'var(--bradius)', background: 'rgba(255,255,255,.65)', cursor: 'pointer',
                }}>
                <span style={{ fontSize: 14, fontWeight: 300, color: 'var(--ink)' }}>¿Necesito autobús?</span>
                <div style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: conBus ? 'var(--accent)' : 'var(--line)',
                  position: 'relative', transition: 'background .2s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', width: 16, height: 16, borderRadius: '50%',
                    background: 'white', top: 3, left: conBus ? 21 : 3,
                    transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                  }} />
                </div>
              </div>

              {conBus && (
                <div>
                  <label style={labelStyle}>Elige tu ruta</label>
                  {buses.map(b => (
                    <div key={b.id}
                      onClick={() => setRutaBus(b.nombre)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 16px', marginTop: 8,
                        border: `1px solid ${rutaBus === b.nombre ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: 'var(--bradius)', background: 'rgba(255,255,255,.65)', cursor: 'pointer',
                      }}>
                      <div style={{
                        width: 13, height: 13, borderRadius: '50%',
                        border: `1.5px solid ${rutaBus === b.nombre ? 'var(--accent)' : 'var(--line)'}`,
                        background: rutaBus === b.nombre ? 'var(--accent)' : 'transparent',
                        flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontWeight: 400, fontSize: 14, color: 'var(--ink)' }}>{b.nombre}</div>
                        {b.hora && <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{b.hora}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {error && (
        <p style={{ fontSize: 13, color: '#c0392b' }}>{error}</p>
      )}

      <button type="submit" disabled={enviando}
        style={{
          marginTop: 8, padding: '18px 32px',
          background: 'var(--btn)', color: 'var(--btnfg)', border: 'none',
          borderRadius: 'var(--bradius)',
          fontFamily: 'var(--lfont)', fontSize: 11, fontWeight: 500,
          letterSpacing: 3, textTransform: 'uppercase', cursor: enviando ? 'default' : 'pointer',
          width: '100%', opacity: enviando ? .7 : 1,
        }}>
        {enviando ? 'Enviando…' : 'Confirmar asistencia'}
      </button>
    </form>
  )
}