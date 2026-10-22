'use client'

import './invitacion.css'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  VARIANTES, SECCIONES, fontUrlInvitacion,
  type InvitacionData, type LugarVista, type ParteConVariantes, type ProgramaItem,
} from '@/lib/invitacion'
import { varsTemaIA } from '@/lib/plantilla-ia'
import type { SeccionInvitacion } from '@/lib/types'
import { SPRITE } from './sprite'
import { SPRITE_EXTRA } from './sprite-extra'

/** Solo en la vista previa del editor: quitar partes y cambiar diseños desde la propia invitación */
export type EdicionInvitacion = {
  quitarSeccion: (s: SeccionInvitacion) => void
  cambiarVariante: (parte: ParteConVariantes, id: string) => void
  quitarMomento: (id: string) => void
}

type Props = {
  data: InvitacionData
  mode: 'live' | 'preview'
  codigo?: string
  edit?: EdicionInvitacion
}

// Adorno entre secciones de las plantillas nuevas y de la creada con IA
const ORNAMENTO: Partial<Record<InvitacionData['tema'], string>> = {
  minimalista: 'linea', boho: 'pampas', magnolia: 'magnolia', lavanda: 'lavanda', playa: 'ondas',
}

function Ic({ n, className }: { n: string; className?: string }) {
  return <svg className={`iv-ic ${className || ''}`} aria-hidden="true"><use href={`#iv-ic-${n}`} /></svg>
}

function Orn({ simbolos }: { simbolos?: string }) {
  return (
    <div className="iv-orn" aria-hidden="true">
      <svg className="iv-o-acua"><use href="#iv-orn-acua" /></svg>
      <svg className="iv-o-carta"><use href="#iv-orn-carta" /></svg>
      <svg className="iv-o-olive"><use href="#iv-orn-olive" /></svg>
      <svg className="iv-o-deco"><use href="#iv-orn-deco" /></svg>
      <svg className="iv-o-flor"><use href="#iv-orn-flor" /></svg>
      <svg className="iv-o-linea"><use href="#iv-orn-linea" /></svg>
      <svg className="iv-o-pampas"><use href="#iv-orn-pampas" /></svg>
      <svg className="iv-o-magnolia"><use href="#iv-orn-magnolia" /></svg>
      <svg className="iv-o-lavanda"><use href="#iv-orn-lavanda" /></svg>
      <svg className="iv-o-ondas"><use href="#iv-orn-ola" /></svg>
      {simbolos && <span className="iv-o-sim">{Array.from(simbolos.replace(/\s/g, '')).join(' ')}</span>}
    </div>
  )
}

/* ─── controles de edición sobre cada parte ─── */
function Ctl({ edit, seccion, parte, actual }: {
  edit?: EdicionInvitacion; seccion: SeccionInvitacion; parte?: ParteConVariantes; actual?: string
}) {
  if (!edit) return null
  const lista = parte ? (VARIANTES[parte] as readonly { id: string; label: string }[]) : null
  const i = lista ? Math.max(0, lista.findIndex(v => v.id === actual)) : 0
  const mover = (paso: number) => {
    if (!lista || !parte) return
    edit.cambiarVariante(parte, lista[(i + paso + lista.length) % lista.length].id)
  }
  const nombre = SECCIONES.find(x => x.id === seccion)?.label || ''
  return (
    <div className="iv-ctl" role="group" aria-label={`Editar ${nombre}`}>
      {lista && (
        <>
          <button type="button" className="iv-ctl-arr" onClick={() => mover(-1)} aria-label="Diseño anterior">‹</button>
          <span className="iv-ctl-lab"><b>{lista[i].label}</b> {i + 1}/{lista.length}</span>
          <button type="button" className="iv-ctl-arr" onClick={() => mover(1)} aria-label="Diseño siguiente">›</button>
          <span className="iv-ctl-sep" />
        </>
      )}
      <button type="button" className="iv-ctl-x" onClick={() => edit.quitarSeccion(seccion)}
        aria-label={`Quitar ${nombre}`} title={`Quitar «${nombre}» de la invitación`}>×</button>
    </div>
  )
}

/* ─── dónde y cuándo ─── */
function Lugar({ titulo, l, v, icono }: { titulo: string; l: LugarVista; v: string; icono: string }) {
  const como = l.mapaUrl && (
    <a className="iv-btn-line" href={l.mapaUrl} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
  )
  if (v === 'lista') {
    return (
      <article className="iv-lrow">
        <div className="iv-lrow-time">{l.hora ? <>{l.hora}<small>h</small></> : <Ic n={icono} />}</div>
        <div className="iv-lrow-txt">
          <h3>{titulo}</h3>
          <p className="iv-place-name">{l.lugar}</p>
          {l.direccion && <p className="iv-place-addr">{l.direccion}</p>}
          {como}
        </div>
      </article>
    )
  }
  return (
    <article className={v === 'tarjetas' ? 'iv-place iv-lcard' : 'iv-place'}>
      {v === 'tarjetas'
        ? <Ic n={icono} className="iv-lcard-ic" />
        : <figure className="iv-phw"><div className="iv-ph"><img src={l.foto} alt="" /></div></figure>}
      <h3>{titulo}</h3>
      {l.hora && <p className="iv-place-time">{l.hora} h</p>}
      <p className="iv-place-name">{l.lugar}</p>
      {l.direccion && <p className="iv-place-addr">{l.direccion}</p>}
      {como}
    </article>
  )
}

/* ─── cómo será el día ─── */
function Programa({ items, v, edit }: { items: ProgramaItem[]; v: string; edit?: EdicionInvitacion }) {
  const x = (p: ProgramaItem) => edit && (
    <button type="button" className="iv-mx" onClick={() => edit.quitarMomento(p.id)}
      aria-label={`Quitar «${p.titulo}» de la invitación`} title="Quitar de la invitación">×</button>
  )
  if (v === 'tarjetas') {
    return (
      <ul className="iv-pg-cards">
        {items.map(p => (
          <li key={p.id}>{x(p)}<Ic n={p.icono} /><time>{p.hora}</time><strong>{p.titulo}</strong></li>
        ))}
      </ul>
    )
  }
  if (v === 'iconos') {
    return (
      <ol className="iv-pg-iconos">
        {items.map(p => (
          <li key={p.id}>{x(p)}<span className="iv-pg-circ"><Ic n={p.icono} /></span><time>{p.hora}</time><strong>{p.titulo}</strong></li>
        ))}
      </ol>
    )
  }
  if (v === 'horario') {
    return (
      <ol className="iv-pg-horario">
        {items.map(p => (
          <li key={p.id}><time>{p.hora || '·'}</time><span className="iv-pg-dots" /><strong>{p.titulo}</strong>{x(p)}</li>
        ))}
      </ol>
    )
  }
  if (v === 'mini') {
    return (
      <p className="iv-pg-mini">
        {items.map(p => (
          <span key={p.id}>{p.hora && <time>{p.hora}</time>} {p.titulo}{x(p)}</span>
        ))}
      </p>
    )
  }
  return (
    <ol className="iv-tl">
      {items.map(p => (
        <li key={p.id}>
          <time className="iv-t-time">{p.hora}</time>
          <span className="iv-t-dot" />
          <span className="iv-t-what"><strong>{p.titulo}</strong>{x(p)}</span>
        </li>
      ))}
    </ol>
  )
}

/* ─── calendario del mes de la boda ─── */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
function Calendario({ fecha }: { fecha: string }) {
  const [y, m, dia] = fecha.split('-').map(Number)
  const primero = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 // lunes = 0
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const huecos = Array.from({ length: primero + total }, (_, i) => (i < primero ? 0 : i - primero + 1))
  return (
    <div className="iv-cal">
      <p className="iv-cal-mes">{MESES[m - 1]} <span>{y}</span></p>
      <div className="iv-cal-grid">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(x => <span key={x} className="iv-cal-wd">{x}</span>)}
        {huecos.map((n, i) => (
          <span key={i} className={n === dia ? 'iv-cal-d iv-cal-on' : 'iv-cal-d'}>
            {n === dia && <Ic n="corazon" className="iv-cal-heart" />}
            <b>{n || ''}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function InvitacionView({ data: d, mode, codigo, edit }: Props) {
  const preview = mode === 'preview'
  const ver = (x: SeccionInvitacion) => !d.ocultas.includes(x)
  const v = d.variantes
  const ia = d.tema === 'ia' && d.temaIA ? d.temaIA : null
  const estiloIA = ia ? (varsTemaIA(ia) as CSSProperties) : undefined
  const orn = ia ? ia.ornamento : ORNAMENTO[d.tema]
  const fechaNum = d.fecha ? d.fecha.split('-').reverse().map((x, i) => (i === 2 ? x.slice(2) : x)).join(' · ') : ''
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
      <link rel="stylesheet" href={fontUrlInvitacion(d)} {...fontLink} />
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: SPRITE + SPRITE_EXTRA }} />

      <div className="iv" data-style={d.tema} data-orn={orn} data-hero={ia?.portada}
        data-edit={edit ? '' : undefined} style={estiloIA}>

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
            <svg className="iv-dx iv-dx-sol" aria-hidden="true"><use href="#iv-sol" /></svg>
            <svg className="iv-dx iv-dx-pampas iv-dxa" aria-hidden="true"><use href="#iv-pampas" /></svg>
            <svg className="iv-dx iv-dx-pampas iv-dxb" aria-hidden="true"><use href="#iv-pampas" /></svg>
            <svg className="iv-dx iv-dx-mag iv-dxa" aria-hidden="true"><use href="#iv-magnolia" /></svg>
            <svg className="iv-dx iv-dx-mag iv-dxb" aria-hidden="true"><use href="#iv-magnolia" /></svg>
            <svg className="iv-dx iv-dx-mag iv-dxc" aria-hidden="true"><use href="#iv-magnolia" /></svg>
            <svg className="iv-dx iv-dx-palma iv-dxa" aria-hidden="true"><use href="#iv-palma" /></svg>
            <svg className="iv-dx iv-dx-palma iv-dxb" aria-hidden="true"><use href="#iv-palma" /></svg>
            <div className="iv-hero-text">
              <svg className="iv-wreath" aria-hidden="true"><use href="#iv-wreath" /></svg>
              <svg className="iv-dx iv-dx-lav" aria-hidden="true"><use href="#iv-lavanda-ramo" /></svg>
              <p className="iv-kicker">{d.kicker}</p>
              <h1 className="iv-names">
                <span className="iv-n">{d.nombre1}</span>
                {both && <><span className="iv-amp">&amp;</span><span className="iv-n">{d.nombre2}</span></>}
              </h1>
              {fechaNum && <p className="iv-date-num" aria-hidden="true">{fechaNum}</p>}
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
            <svg className="iv-dx iv-dx-olas" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><use href="#iv-olas" /></svg>
          </header>

          {/* ═══ CUENTA ATRÁS ═══ */}
          {d.inicioISO && ver('cuenta') && (
            <section className={`iv-cd iv-cd-${v.cuenta}`} aria-label="Cuenta atrás">
              <Ctl edit={edit} seccion="cuenta" parte="cuenta" actual={v.cuenta} />
              {v.cuenta === 'calendario' ? (
                <>
                  <Calendario fecha={d.fecha} />
                  <p className="iv-cd-sub">Faltan <b>{cd ? cd.d : '–'}</b> días</p>
                </>
              ) : v.cuenta === 'frase' ? (
                <p className="iv-cd-big">Faltan <b>{cd ? cd.d : '–'}</b> días<small>para el gran día</small></p>
              ) : (
                <>
                  <p className="iv-cd-intro">Faltan</p>
                  <div className="iv-cd-grid">
                    <div className="iv-cd-item"><span className="iv-cd-num">{cd ? cd.d : '–'}</span><span className="iv-cd-lab">días</span></div>
                    <div className="iv-cd-item"><span className="iv-cd-num">{cd ? cd.h : '–'}</span><span className="iv-cd-lab">horas</span></div>
                    <div className="iv-cd-item"><span className="iv-cd-num">{cd ? cd.m : '–'}</span><span className="iv-cd-lab">minutos</span></div>
                    <div className="iv-cd-item"><span className="iv-cd-num">{cd ? cd.s : '–'}</span><span className="iv-cd-lab">segundos</span></div>
                  </div>
                  <p className="iv-cd-line">Faltan {cd ? cd.d : '–'} días para el gran día</p>
                </>
              )}
            </section>
          )}

          {/* ═══ CARTA DE LOS NOVIOS ═══ */}
          {(d.saludo || parrafos.length > 0) && ver('carta') && (
            <>
              <Orn simbolos={ia?.simbolos} />
              <section className="iv-sec iv-story">
                <Ctl edit={edit} seccion="carta" />
                {d.saludo && <p className="iv-salute">{d.saludo}</p>}
                <div className="iv-body">{parrafos.map((p, i) => <p key={i}>{p}</p>)}</div>
                <p className="iv-sign">{both ? `${d.nombre1} y ${d.nombre2}` : d.nombre1}</p>
              </section>
            </>
          )}

          {/* ═══ DÓNDE Y CUÁNDO ═══ */}
          {hayDetalles && ver('lugares') && (
            <>
              <Orn simbolos={ia?.simbolos} />
              <section className="iv-sec">
                <Ctl edit={edit} seccion="lugares" parte="lugares" actual={v.lugares} />
                <h2 className="iv-title">Dónde y cuándo</h2>
                <div className={`iv-places iv-places-${v.lugares}`}>
                  {d.ceremonia.lugar && <Lugar titulo="La ceremonia" l={d.ceremonia} v={v.lugares} icono="anillos" />}
                  {d.celebracion.lugar && <Lugar titulo="La celebración" l={d.celebracion} v={v.lugares} icono="copas" />}
                </div>
              </section>
            </>
          )}

          {/* ═══ PROGRAMA ═══ */}
          {ver('programa') && (d.programa.length > 0 || edit) && (
            <div className="iv-band">
              <section className="iv-sec">
                <Ctl edit={edit} seccion="programa" parte="programa" actual={v.programa} />
                <h2 className="iv-title">Cómo será el día</h2>
                {d.programa.length > 0
                  ? <Programa items={d.programa} v={v.programa} edit={edit} />
                  : <p className="iv-edit-note">Añade momentos en el Cronograma o vuelve a activarlos en el editor.</p>}
              </section>
            </div>
          )}

          {/* ═══ AUTOBUSES ═══ */}
          {d.buses.length > 0 && ver('autobuses') && (
            <section className="iv-sec">
              <Ctl edit={edit} seccion="autobuses" />
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
          {d.iban && ver('regalo') && (
            <>
              <Orn simbolos={ia?.simbolos} />
              <section className="iv-sec">
                <Ctl edit={edit} seccion="regalo" />
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
          {d.contactos.length > 0 && ver('contacto') && (
            <section className="iv-sec">
              <Ctl edit={edit} seccion="contacto" />
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
            <Orn simbolos={ia?.simbolos} />
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
