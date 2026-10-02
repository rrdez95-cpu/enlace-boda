'use client'

import './invitacion.css'
import { useEffect, useRef, useState } from 'react'
import { FONT_URL, type InvitacionData, type LugarVista } from '@/lib/invitacion'
import { SPRITE } from './sprite'

type Props = {
  data: InvitacionData
  mode: 'live' | 'preview'
  codigo?: string
}

function Orn() {
  return (
    <div className="iv-orn" aria-hidden="true">
      <svg className="iv-o-acua"><use href="#iv-orn-acua" /></svg>
      <svg className="iv-o-carta"><use href="#iv-orn-carta" /></svg>
      <svg className="iv-o-olive"><use href="#iv-orn-olive" /></svg>
      <svg className="iv-o-deco"><use href="#iv-orn-deco" /></svg>
      <svg className="iv-o-flor"><use href="#iv-orn-flor" /></svg>
    </div>
  )
}

function Lugar({ titulo, l }: { titulo: string; l: LugarVista }) {
  return (
    <article className="iv-place">
      <figure className="iv-phw"><div className="iv-ph"><img src={l.foto} alt="" /></div></figure>
      <h3>{titulo}</h3>
      {l.hora && <p className="iv-place-time">{l.hora} h</p>}
      <p className="iv-place-name">{l.lugar}</p>
      {l.direccion && <p className="iv-place-addr">{l.direccion}</p>}
      {l.mapaUrl && (
        <a className="iv-btn-line" href={l.mapaUrl} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
      )}
    </article>
  )
}

export default function InvitacionView({ data: d, mode, codigo }: Props) {
  const preview = mode === 'preview'
  const both = !!d.nombre2
  const nombres = both ? `${d.nombre1} & ${d.nombre2}` : d.nombre1
  const iniciales = (d.nombre1.charAt(0) + (both ? '&' + d.nombre2.charAt(0) : '')).toUpperCase()

  /* ─── sobre (estilo Carta) ─── */
  const [sobre, setSobre] = useState<'cerrado' | 'abierto' | 'fuera'>(d.tema === 'carta' ? 'cerrado' : 'fuera')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    setSobre(d.tema === 'carta' ? 'cerrado' : 'fuera')
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [d.tema])
  useEffect(() => {
    if (preview || sobre === 'fuera') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [sobre, preview])
  function abrirSobre() {
    if (sobre !== 'cerrado') return
    setSobre('abierto')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    timer.current = setTimeout(() => setSobre('fuera'), reduce ? 150 : 2300)
  }

  /* ─── cuenta atrás ─── */
  const [ahora, setAhora] = useState<number | null>(null)
  useEffect(() => {
    setAhora(Date.now())
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const objetivo = d.inicioISO ? new Date(d.inicioISO).getTime() : NaN
  const resta = ahora !== null && !isNaN(objetivo) ? Math.max(0, objetivo - ahora) : null
  const cd = resta === null ? null : {
    d: Math.floor(resta / 864e5),
    h: String(Math.floor((resta % 864e5) / 36e5)).padStart(2, '0'),
    m: String(Math.floor((resta % 36e5) / 6e4)).padStart(2, '0'),
    s: String(Math.floor((resta % 6e4) / 1e3)).padStart(2, '0'),
  }

  /* ─── IBAN ─── */
  const [copiado, setCopiado] = useState('')
  async function copiarIban() {
    try {
      await navigator.clipboard.writeText(d.iban.replace(/\s/g, ''))
      setCopiado('Copiado')
    } catch {
      setCopiado('Mantén pulsado el número para copiarlo')
    }
    setTimeout(() => setCopiado(''), 2200)
  }

  /* ─── confirmación ─── */
  const [nombre, setNombre] = useState('')
  const [asiste, setAsiste] = useState<boolean | null>(null)
  const [conAcomp, setConAcomp] = useState(false)
  const [acomp, setAcomp] = useState('')
  const [acompEditado, setAcompEditado] = useState(false)
  const [intol, setIntol] = useState('')
  const [trayecto, setTrayecto] = useState('')
  const [ruta, setRuta] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    if (conAcomp && !acompEditado) setAcomp(nombre.trim() ? `Acompañante de ${nombre.trim()}` : '')
  }, [nombre, conAcomp, acompEditado])

  const rutas = Array.from(new Set(d.buses.map(b => b.nombre).filter(Boolean)))

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) { setError('Escribe tu nombre para que sepamos quién eres.'); return }
    if (asiste === null) { setError('Dinos si podrás venir.'); return }
    setError('')
    if (preview || !codigo) { setEnviado(true); return }
    setEnviando(true)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          nombre: n,
          asiste,
          nombre_acomp: asiste && conAcomp ? (acomp.trim() || `Acompañante de ${n}`) : undefined,
          intolerancia: asiste ? intol.trim() : undefined,
          necesita_bus: asiste && !!trayecto,
          ruta_bus: asiste && trayecto ? [ruta, trayecto].filter(Boolean).join(', ') : undefined,
          mensaje: mensaje.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('rsvp')
      setEnviado(true)
    } catch {
      setError('No se ha podido enviar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const primerNombre = nombre.trim().split(' ')[0]
  const parrafos = d.mensaje.split(/\n+/).map(p => p.trim()).filter(Boolean)
  const hayDetalles = !!(d.ceremonia.lugar || d.celebracion.lugar)
  const fontLink = { precedence: 'default' } as Record<string, string>

  return (
    <div className={`iv-root ${preview ? 'iv-is-preview' : 'iv-is-live'}`}>
      <link rel="stylesheet" href={FONT_URL[d.tema]} {...fontLink} />
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: SPRITE }} />

      <div className="iv" data-style={d.tema}>

        {/* ═══ SOBRE ═══ */}
        <div className={`iv-env ${sobre === 'abierto' ? 'iv-open' : ''} ${sobre === 'fuera' ? 'iv-gone' : ''}`}>
          <div className="iv-envelope">
            <div className="iv-env-back" />
            <div className="iv-env-letter">
              <span className="iv-el-names">{nombres}</span>
              <span className="iv-el-sub">tienen el placer de invitaros a su boda</span>
            </div>
            <div className="iv-env-pocket" />
            <div className="iv-env-flap" />
            <button className="iv-env-seal" type="button" onClick={abrirSobre} aria-label="Abrir la invitación">
              {iniciales}
            </button>
          </div>
          <p className="iv-env-hint">Toca el sello para abrir</p>
        </div>

        <main className="iv-inv">

          {/* ═══ PORTADA ═══ */}
          <header className="iv-hero">
            <span className="iv-bloom iv-b1" aria-hidden="true" />
            <span className="iv-bloom iv-b2" aria-hidden="true" />
            <div className="iv-frame" aria-hidden="true">
              {[1, 2, 3, 4].map(i => <svg key={i} className={`iv-dc${i}`}><use href="#iv-deco-corner" /></svg>)}
            </div>
            <svg className="iv-sun" aria-hidden="true"><use href="#iv-sunburst" /></svg>
            <div className="iv-hero-text">
              <svg className="iv-wreath" aria-hidden="true"><use href="#iv-wreath" /></svg>
              <p className="iv-kicker">Nos casamos</p>
              <h1 className="iv-names">
                <span className="iv-n">{d.nombre1}</span>
                {both && <><span className="iv-amp">&amp;</span><span className="iv-n">{d.nombre2}</span></>}
              </h1>
              {d.fechaLarga && <p className="iv-date"><time dateTime={d.fecha}>{d.fechaLarga}</time></p>}
              {d.sitioPortada && <p className="iv-place">{d.sitioPortada}</p>}
            </div>
            <div className="iv-stampg" aria-hidden="true">
              <div className="iv-stamp">
                <div className="iv-stamp-in">
                  <svg><use href="#iv-rings" /></svg>
                  <span className="iv-si-ini">{iniciales}</span>
                  <span>{d.anio}</span>
                </div>
              </div>
              <svg className="iv-postmark" viewBox="0 0 150 70">
                <g fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="35" cy="35" r="30" /><circle cx="35" cy="35" r="22" />
                  <path d="M70 22c10-6 20 6 30 0s20 6 30 0s12 4 18 2M70 35c10-6 20 6 30 0s20 6 30 0s12 4 18 2M70 48c10-6 20 6 30 0s20 6 30 0s12 4 18 2" />
                </g>
                <text x="35" y="32" textAnchor="middle" fontSize="7.5" fill="currentColor">CON AMOR</text>
                <text x="35" y="44" textAnchor="middle" fontSize="8" fill="currentColor">{d.matasellos}</text>
              </svg>
            </div>
            <figure className="iv-phw iv-hero-ph">
              <span className="iv-tape iv-t1" /><span className="iv-tape iv-t2" />
              <div className="iv-ph"><img src={d.fotoPortada} alt="" /></div>
            </figure>
          </header>

          {/* ═══ CUENTA ATRÁS ═══ */}
          {d.inicioISO && (
            <section className="iv-cd" aria-label="Cuenta atrás">
              <p className="iv-cd-intro">Faltan</p>
              <div className="iv-cd-grid">
                <div className="iv-cd-item"><span className="iv-cd-num">{cd ? cd.d : '–'}</span><span className="iv-cd-lab">días</span></div>
                <div className="iv-cd-item"><span className="iv-cd-num">{cd ? cd.h : '–'}</span><span className="iv-cd-lab">horas</span></div>
                <div className="iv-cd-item"><span className="iv-cd-num">{cd ? cd.m : '–'}</span><span className="iv-cd-lab">minutos</span></div>
                <div className="iv-cd-item"><span className="iv-cd-num">{cd ? cd.s : '–'}</span><span className="iv-cd-lab">segundos</span></div>
              </div>
              <p className="iv-cd-line">Faltan {cd ? cd.d : '–'} días para el gran día</p>
            </section>
          )}

          {/* ═══ CARTA DE LOS NOVIOS ═══ */}
          {(d.saludo || parrafos.length > 0) && (
            <>
              <Orn />
              <section className="iv-sec iv-story">
                {d.saludo && <p className="iv-salute">{d.saludo}</p>}
                <div className="iv-body">{parrafos.map((p, i) => <p key={i}>{p}</p>)}</div>
                <p className="iv-sign">{both ? `${d.nombre1} y ${d.nombre2}` : d.nombre1}</p>
              </section>
            </>
          )}

          {/* ═══ DÓNDE Y CUÁNDO ═══ */}
          {hayDetalles && (
            <>
              <Orn />
              <section className="iv-sec">
                <h2 className="iv-title">Dónde y cuándo</h2>
                <div className="iv-places">
                  {d.ceremonia.lugar && <Lugar titulo="La ceremonia" l={d.ceremonia} />}
                  {d.celebracion.lugar && <Lugar titulo="La celebración" l={d.celebracion} />}
                </div>
              </section>
            </>
          )}

          {/* ═══ PROGRAMA ═══ */}
          {d.programa.length > 0 && (
            <div className="iv-band">
              <section className="iv-sec">
                <h2 className="iv-title">Cómo será el día</h2>
                <ol className="iv-tl">
                  {d.programa.map((p, i) => (
                    <li key={i}>
                      <time className="iv-t-time">{p.hora}</time>
                      <span className="iv-t-dot" />
                      <span className="iv-t-what"><strong>{p.titulo}</strong>{p.nota && <span>{p.nota}</span>}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}

          {/* ═══ AUTOBUSES ═══ */}
          {d.buses.length > 0 && (
            <section className="iv-sec">
              <h2 className="iv-title">Autobuses</h2>
              <p>Hemos reservado autobuses para que nadie tenga que preocuparse por el coche. Indícalo al confirmar y te guardamos sitio.</p>
              <div className="iv-buses">
                {d.buses.map((b, i) => (
                  <article key={i} className="iv-bus">
                    <h3>{b.nombre}</h3>
                    {b.ida && <p className="iv-bus-time">Ida a las {b.ida} h</p>}
                    {b.vuelta && <p className="iv-bus-time">Vuelta a las {b.vuelta} h</p>}
                    {b.punto && <p>{b.punto}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ═══ REGALO ═══ */}
          {d.iban && (
            <>
              <Orn />
              <section className="iv-sec">
                <h2 className="iv-title">Si queréis tener un detalle</h2>
                {d.regalosTexto && <p>{d.regalosTexto}</p>}
                <div className="iv-iban">
                  <code>{d.iban}</code>
                  <button className="iv-link" type="button" onClick={copiarIban}>{copiado || 'Copiar'}</button>
                </div>
              </section>
            </>
          )}

          {/* ═══ CONFIRMACIÓN ═══ */}
          <div className="iv-band">
            <section className="iv-sec" id="confirmar">
              <h2 className="iv-title">¿Vienes?</h2>
              <p>
                {d.fechaLimite ? `Confírmanos antes del ${d.fechaLimite} ` : 'Confírmanos cuanto antes '}
                para que podamos organizar las mesas y los autobuses.
              </p>

              {enviado ? (
                <div className="iv-thanks" aria-live="polite">
                  <h3>{asiste ? `¡Qué ilusión, ${primerNombre}!` : `Te echaremos de menos, ${primerNombre}`}</h3>
                  <p>{asiste
                    ? `Hemos guardado tu confirmación.${d.fechaCorta ? ` Nos vemos el ${d.fechaCorta}.` : ''}`
                    : 'Gracias por avisarnos. Brindaremos por ti.'}</p>
                  {preview && <p className="iv-preview-note">Esto es la vista previa: la respuesta no se ha enviado.</p>}
                  <button className="iv-link" type="button" onClick={() => setEnviado(false)}>Cambiar mi respuesta</button>
                </div>
              ) : (
                <form className="iv-form" onSubmit={enviar} noValidate>
                  <div className="iv-field">
                    <label htmlFor="iv-nombre">Nombre y apellidos</label>
                    <input className="iv-input" id="iv-nombre" autoComplete="name" placeholder="María García"
                      value={nombre} onChange={e => setNombre(e.target.value)} />
                  </div>

                  <div className="iv-field">
                    <span className="iv-lab" id="iv-l-asiste">¿Podrás venir?</span>
                    <div className="iv-choice" role="group" aria-labelledby="iv-l-asiste">
                      <button type="button" aria-pressed={asiste === true} onClick={() => { setAsiste(true); setError('') }}>Sí, allí estaré</button>
                      <button type="button" aria-pressed={asiste === false} onClick={() => { setAsiste(false); setError('') }}>No podré ir</button>
                    </div>
                  </div>

                  {asiste === true && (
                    <div className="iv-ifyes">
                      <div className="iv-field">
                        <label className="iv-check">
                          <input type="checkbox" checked={conAcomp}
                            onChange={e => { setConAcomp(e.target.checked); setAcompEditado(false) }} />
                          Vengo con acompañante
                        </label>
                      </div>
                      {conAcomp && (
                        <div className="iv-field">
                          <label htmlFor="iv-acomp">Nombre de tu acompañante</label>
                          <input className="iv-input" id="iv-acomp" value={acomp}
                            onChange={e => { setAcomp(e.target.value); setAcompEditado(e.target.value.trim() !== '') }} />
                          <span className="iv-hint">Lo hemos rellenado por ti. Cámbialo si quieres poner su nombre.</span>
                        </div>
                      )}
                      <div className="iv-field">
                        <label htmlFor="iv-intol">Alergias o intolerancias</label>
                        <input className="iv-input" id="iv-intol" placeholder="Ninguna"
                          value={intol} onChange={e => setIntol(e.target.value)} />
                      </div>
                      {d.buses.length > 0 && (
                        <div className="iv-field">
                          <label htmlFor="iv-bus">Autobús</label>
                          <select className="iv-input" id="iv-bus" value={trayecto} onChange={e => setTrayecto(e.target.value)}>
                            <option value="">No, voy por mi cuenta</option>
                            <option>Ida y vuelta</option>
                            <option>Solo ida</option>
                            <option>Solo vuelta</option>
                          </select>
                        </div>
                      )}
                      {trayecto && rutas.length > 1 && (
                        <div className="iv-field">
                          <label htmlFor="iv-ruta">¿Qué autobús?</label>
                          <select className="iv-input" id="iv-ruta" value={ruta} onChange={e => setRuta(e.target.value)}>
                            <option value="">Elige uno</option>
                            {rutas.map(r => <option key={r}>{r}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="iv-field">
                    <label htmlFor="iv-msg">Un mensaje para los novios (opcional)</label>
                    <textarea className="iv-input" id="iv-msg" rows={2} value={mensaje} onChange={e => setMensaje(e.target.value)} />
                  </div>
                  <p className="iv-err" role="alert">{error}</p>
                  <button className="iv-btn" type="submit" disabled={enviando}>
                    {enviando ? 'Enviando…' : 'Enviar confirmación'}
                  </button>
                </form>
              )}
            </section>
          </div>

          {/* ═══ CONTACTO ═══ */}
          {d.contactos.length > 0 && (
            <section className="iv-sec">
              <h2 className="iv-title">¿Alguna duda?</h2>
              <p>Escríbenos o llámanos cuando quieras.</p>
              <div className="iv-contacts">
                {d.contactos.map((c, i) => (
                  <div key={i} className="iv-contact">
                    <strong>{c.nombre}</strong>
                    <a href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`}>{c.telefono}</a>
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer className="iv-foot">
            <Orn />
            <p className="iv-foot-names">{nombres}</p>
            {d.fechaCorta && <p className="iv-foot-date">{d.fechaCorta}</p>}
            <p className="iv-foot-made">
              Invitación creada con <a href="https://enlaceboda.es" target="_blank" rel="noopener noreferrer">Enlace</a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
