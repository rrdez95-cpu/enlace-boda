'use client'

import { useState, useEffect } from 'react'
import { BodaData, Proveedor } from '@/lib/types'
import { DEFAULT_CHECKLIST } from './checklist-data'

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  showToast: (m: string) => void
  isPro: boolean
  onPaywall: () => void
}

const SECCIONES = [
  { grupo: 'Celebración', items: [
    { id: 'sec-fecha', icon: '📅', label: 'Fecha y datos', free: true },
    { id: 'sec-ceremonia', icon: '⛪', label: 'Ceremonia' },
    { id: 'sec-coctel', icon: '🥂', label: 'Cóctel' },
    { id: 'sec-banquete', icon: '🍽️', label: 'Banquete' },
    { id: 'sec-barra', icon: '🍸', label: 'Barra libre' },
    { id: 'sec-musica', icon: '🎶', label: 'Música' },
    { id: 'sec-foto', icon: '📷', label: 'Foto y vídeo' },
  ]},
  { grupo: 'Logística', items: [
    { id: 'sec-transporte', icon: '🚌', label: 'Transporte' },
    { id: 'sec-alojamiento', icon: '🏨', label: 'Alojamiento' },
    { id: 'sec-proveedores', icon: '📋', label: 'Proveedores' },
    { id: 'sec-presupuesto', icon: '💰', label: 'Presupuesto' },
  ]},
  { grupo: 'Planificación', items: [
    { id: 'sec-checklist', icon: '✓', label: 'Checklist' },
  ]},
]

export default function TabResumen({ data, setData, showToast, isPro, onPaywall }: Props) {
  const [activeNav, setActiveNav] = useState('sec-fecha')
  const [ckFilter, setCkFilter] = useState<'all' | 'pendiente' | 'hecho' | 'urgente'>('all')
  const [provModal, setProvModal] = useState(false)

  useEffect(() => {
    if (data.checklist.length === 0) {
      setData(d => ({
        ...d,
        checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, id: 1000 + i, done: false })),
      }))
    }
  }, [])

  const R = data.resumen || {}
  function setR(k: string, v: string) {
    setData(d => ({ ...d, resumen: { ...d.resumen, [k]: v } }))
  }

  function scrollTo(id: string, free?: boolean) {
    if (!isPro && !free) { onPaywall(); return }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveNav(id)
  }

  function addItem(list: string) {
    setData(d => ({
      ...d,
      rItems: { ...d.rItems, [list]: [...(d.rItems[list] || []), { id: d.riid, text: '' }] },
      riid: d.riid + 1,
    }))
  }
  function updItem(list: string, id: number, text: string) {
    setData(d => ({
      ...d,
      rItems: { ...d.rItems, [list]: (d.rItems[list] || []).map(i => i.id === id ? { ...i, text } : i) },
    }))
  }
  function delItem(list: string, id: number) {
    setData(d => ({
      ...d,
      rItems: { ...d.rItems, [list]: (d.rItems[list] || []).filter(i => i.id !== id) },
    }))
  }

  const costes = {
    ceremonia: parseFloat(R.costeCeremonia || '0'),
    coctel: parseFloat(R.costeCoctel || '0'),
    banquete: (parseFloat(R.precioPax || '0') * parseFloat(R.numPax || '0')),
    barra: parseFloat(R.costeBarra || '0'),
    musica: parseFloat(R.costeDJ || '0') + parseFloat(R.costeBanda || '0'),
    foto: parseFloat(R.costeFoto || '0') + parseFloat(R.costeVideo || '0'),
    transporte: parseFloat(R.costeCoche || '0'),
    alojamiento: parseFloat(R.costeHotel || '0'),
  }
  const totalConfirmado = Object.values(costes).reduce((a, b) => a + (b || 0), 0)
  const presupuesto = parseFloat(R.presupuesto || '0')
  const recaudado = data.guests.filter(g => g.paid === 'si')
    .reduce((s, g) => s + (parseFloat(g.importe) || 0), 0)

  let ckList = data.checklist
  if (ckFilter === 'pendiente') ckList = ckList.filter(c => !c.done)
  if (ckFilter === 'hecho') ckList = ckList.filter(c => c.done)
  if (ckFilter === 'urgente') ckList = ckList.filter(c => c.p === 'urgente' && !c.done)

  const ckGroups: Record<string, typeof ckList> = {}
  const ckOrder: string[] = []
  ckList.forEach(c => {
    if (!ckGroups[c.g]) { ckGroups[c.g] = []; ckOrder.push(c.g) }
    ckGroups[c.g].push(c)
  })
  const ckDone = data.checklist.filter(c => c.done).length
  const ckPct = data.checklist.length ? Math.round(ckDone / data.checklist.length * 100) : 0

  function toggleCheck(id: number) {
    setData(d => ({
      ...d,
      checklist: d.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c),
    }))
  }

  function deleteProv(id: number) {
    setData(d => ({ ...d, proveedores: d.proveedores.filter(p => p.id !== id) }))
  }

  return (
    <div className="screen">
      <nav className="res-sidenav">
        {SECCIONES.map(sec => (
          <div key={sec.grupo}>
            <div className="rnav-section">{sec.grupo}</div>
            {sec.items.map(it => (
              <div key={it.id}
                className={`rnav-link ${activeNav === it.id ? 'active' : ''}`}
                onClick={() => scrollTo(it.id, it.free)}>
                <span className="rnav-icon">{it.icon}</span>
                {it.label}
                {!isPro && !it.free && <span style={{ marginLeft: 'auto', fontSize: 10 }}>🔒</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="res-main">
        {/* FECHA — SIEMPRE GRATIS */}
        <Section id="sec-fecha" icon="📅" title="Fecha y datos de la boda" sub="Información general del gran día">
          <div className="sec-body-3">
            <div>
              <Field label="Fecha de la boda" type="date" value={R.fecha || ''} onChange={v => setR('fecha', v)} />
              <Field label="Hora de inicio" type="time" value={R.horaInicio || '12:00'} onChange={v => setR('horaInicio', v)} />
            </div>
            <div>
              <Field label="Nombre de los novios" value={R.novios || ''} placeholder="Laura y Alejandro" onChange={v => setR('novios', v)} />
              <Field label="Finca / espacio" value={R.finca || ''} placeholder="Finca La Heredad" onChange={v => setR('finca', v)} />
            </div>
            <div>
              <Field label="Nº total de invitados" type="number" value={R.totalInv || ''} placeholder="150" onChange={v => setR('totalInv', v)} />
              <Field label="Coordinador/a" value={R.coordinador || ''} placeholder="Nombre + teléfono" onChange={v => setR('coordinador', v)} />
            </div>
          </div>
        </Section>

        {/* BANNER SI NO ES PRO */}
        {!isPro && (
          <div className="limit-banner" onClick={onPaywall} style={{ marginBottom: 0, padding: '18px 22px' }}>
            <span className="lb-icon">🔒</span>
            <span className="lb-text" style={{ fontSize: 13 }}>
              <strong>Desbloquea el resumen completo</strong><br />
              Ceremonia, cóctel, banquete, barra libre, música, foto y vídeo,
              transporte, alojamiento, proveedores, presupuesto y checklist de 52 tareas.
            </span>
            <span className="lb-cta">3,99 € →</span>
          </div>
        )}

        {/* RESTO — SOLO PRO */}
        {isPro && (
          <>
            <Section id="sec-ceremonia" icon="⛪" title="Ceremonia" sub="Estructura y orden del acto" cost={costes.ceremonia}>
              <div className="sec-body">
                <SubSec title="Datos generales">
                  <div className="fr">
                    <SelectField label="Tipo de ceremonia" value={R.tipoCeremonia || 'Civil'} onChange={v => setR('tipoCeremonia', v)}
                      options={['Civil', 'Religiosa', 'Simbólica', 'Mixta']} />
                    <Field label="Lugar" value={R.lugarCeremonia || ''} placeholder="Jardín de la finca" onChange={v => setR('lugarCeremonia', v)} />
                  </div>
                  <div className="fr">
                    <Field label="Hora de inicio" type="time" value={R.horaCeremonia || '12:00'} onChange={v => setR('horaCeremonia', v)} />
                    <Field label="Duración" value={R.durCeremonia || ''} placeholder="45 minutos" onChange={v => setR('durCeremonia', v)} />
                  </div>
                  <Field label="Coste ceremonia (€)" type="number" value={R.costeCeremonia || ''} onChange={v => setR('costeCeremonia', v)} />
                </SubSec>
                <SubSec title="Oficiante">
                  <div className="fr">
                    <Field label="Nombre del oficiante" value={R.oficiante || ''} onChange={v => setR('oficiante', v)} />
                    <Field label="Contacto" value={R.oficianteTel || ''} onChange={v => setR('oficianteTel', v)} />
                  </div>
                  <TextArea label="Notas sobre el oficiante" value={R.oficianteNotas || ''} onChange={v => setR('oficianteNotas', v)} />
                </SubSec>
                <SubSec title="Música en la ceremonia">
                  <div className="fr">
                    <Field label="Entrada de los novios" value={R.musEntrada || ''} placeholder="Canción" onChange={v => setR('musEntrada', v)} />
                    <Field label="Salida de los novios" value={R.musSalida || ''} placeholder="Canción" onChange={v => setR('musSalida', v)} />
                  </div>
                  <Field label="Música de fondo" value={R.musFondo || ''} placeholder="Cuarteto de cuerda" onChange={v => setR('musFondo', v)} />
                </SubSec>
                <SubSec title="Elementos simbólicos">
                  <Toggle label="Anillos de boda" sub="Portador/a confirmado" checked={R.tAnillos === '1'} onChange={v => setR('tAnillos', v ? '1' : '')} />
                  <Toggle label="Arras" sub="13 monedas" checked={R.tArras === '1'} onChange={v => setR('tArras', v ? '1' : '')} />
                  <Toggle label="Vela de la unidad" checked={R.tVela === '1'} onChange={v => setR('tVela', v ? '1' : '')} />
                  <Toggle label="Lazo de los novios" checked={R.tLazo === '1'} onChange={v => setR('tLazo', v ? '1' : '')} />
                  <Toggle label="Ramo de novia" sub="Florista confirmada" checked={R.tRamo === '1'} onChange={v => setR('tRamo', v ? '1' : '')} />
                  <div style={{ marginTop: 12 }}>
                    <TextArea label="Lectura / texto elegido" value={R.lectura || ''} onChange={v => setR('lectura', v)} />
                  </div>
                </SubSec>
              </div>
            </Section>

            <Section id="sec-coctel" icon="🥂" title="Cóctel de bienvenida" sub="Aperitivos, bebidas y entretenimiento" cost={costes.coctel}>
              <div className="sec-body">
                <div className="fr" style={{ marginBottom: 14 }}>
                  <Field label="Hora de inicio" type="time" value={R.horaCoctel || '13:30'} onChange={v => setR('horaCoctel', v)} />
                  <Field label="Duración" value={R.durCoctel || ''} placeholder="90 minutos" onChange={v => setR('durCoctel', v)} />
                  <Field label="Ubicación" value={R.ubiCoctel || ''} placeholder="Terraza" onChange={v => setR('ubiCoctel', v)} />
                  <Field label="Coste total (€)" type="number" value={R.costeCoctel || ''} onChange={v => setR('costeCoctel', v)} />
                </div>
                <ItemList title="Canapés fríos" list="cn-frios" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <ItemList title="Canapés calientes" list="cn-calientes" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <ItemList title="Estaciones y bufés" list="estaciones" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <ItemList title="Bebidas del cóctel" list="beb-coctel" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <SubSec title="Música del cóctel">
                  <div className="fr">
                    <Field label="Grupo / artista" value={R.grupoCoctel || ''} placeholder="Nombre + contacto" onChange={v => setR('grupoCoctel', v)} />
                    <Field label="Horas contratadas" value={R.horasCoctel || ''} placeholder="1.5 h" onChange={v => setR('horasCoctel', v)} />
                  </div>
                  <TextArea label="Repertorio acordado" value={R.repCoctel || ''} onChange={v => setR('repCoctel', v)} />
                </SubSec>
              </div>
            </Section>

            <Section id="sec-banquete" icon="🍽️" title="Banquete" sub="Menú completo, vinos y servicio" cost={costes.banquete}>
              <div className="sec-body">
                <div className="fr" style={{ marginBottom: 14 }}>
                  <Field label="Catering" value={R.catering || ''} placeholder="Nombre empresa" onChange={v => setR('catering', v)} />
                  <Field label="€/persona" type="number" value={R.precioPax || ''} placeholder="95" onChange={v => setR('precioPax', v)} />
                  <Field label="Nº comensales" type="number" value={R.numPax || ''} placeholder="150" onChange={v => setR('numPax', v)} />
                  <div className="fg">
                    <label className="fl">Total banquete</label>
                    <input className="fi2" readOnly value={`${costes.banquete.toLocaleString('es-ES')} €`}
                      style={{ fontWeight: 700, color: 'var(--gold)' }} />
                  </div>
                </div>
                <ItemList title="Entrantes" list="entrantes" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <ItemList title="Platos principales" list="principales" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <ItemList title="Postres" list="postres" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <ItemList title="Vinos y maridaje" list="vinos" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <SubSec title="Tarta nupcial">
                  <div className="fr">
                    <Field label="Pastelería" value={R.pasteleria || ''} onChange={v => setR('pasteleria', v)} />
                    <Field label="Sabores" value={R.saboresTarta || ''} placeholder="Vainilla y frutos rojos" onChange={v => setR('saboresTarta', v)} />
                  </div>
                </SubSec>
                <SubSec title="Intolerancias">
                  <TextArea label="Resumen de intolerancias" value={R.intolerancias || ''}
                    placeholder="3 celíacos (mesa 4,7,12), 2 veganos (mesa 2)..." onChange={v => setR('intolerancias', v)} />
                  {data.guests.filter(g => g.intolerancia).length > 0 && (
                    <div style={{ marginTop: 10, padding: 12, background: 'var(--ivory2)', borderRadius: 6, fontSize: 12 }}>
                      <strong>Detectadas automáticamente:</strong>
                      {data.guests.filter(g => g.intolerancia).map(g => (
                        <div key={g.id} style={{ marginTop: 4, color: 'var(--muted)' }}>
                          {g.nombre} {g.apellido} — {g.intolerancia}
                        </div>
                      ))}
                    </div>
                  )}
                </SubSec>
              </div>
            </Section>

            <Section id="sec-barra" icon="🍸" title="Barra libre" sub="Bebidas, horas y extras" cost={costes.barra}>
              <div className="sec-body">
                <div className="fr" style={{ marginBottom: 14 }}>
                  <Field label="Hora inicio" type="time" value={R.horaBarra || '19:00'} onChange={v => setR('horaBarra', v)} />
                  <Field label="Horas contratadas" value={R.horasBarra || ''} placeholder="5 horas" onChange={v => setR('horasBarra', v)} />
                  <Field label="Hora cierre" type="time" value={R.cierreBarra || '00:00'} onChange={v => setR('cierreBarra', v)} />
                  <Field label="Coste total (€)" type="number" value={R.costeBarra || ''} onChange={v => setR('costeBarra', v)} />
                </div>
                <ItemList title="Bebidas incluidas" list="beb-barra" data={data} onAdd={addItem} onUpd={updItem} onDel={delItem} />
                <SubSec title="Extras especiales">
                  <Toggle label="Barra de gin-tonics" checked={R.eGin === '1'} onChange={v => setR('eGin', v ? '1' : '')} />
                  <Toggle label="Barra de cócteles clásicos" checked={R.eCocteles === '1'} onChange={v => setR('eCocteles', v ? '1' : '')} />
                  <Toggle label="Barra de chupitos" checked={R.eChupitos === '1'} onChange={v => setR('eChupitos', v ? '1' : '')} />
                  <Toggle label="Mesa de dulces / candy bar" checked={R.eCandy === '1'} onChange={v => setR('eCandy', v ? '1' : '')} />
                  <Toggle label="Cervezas artesanas" checked={R.eCerveza === '1'} onChange={v => setR('eCerveza', v ? '1' : '')} />
                </SubSec>
              </div>
            </Section>

            <Section id="sec-musica" icon="🎶" title="Música y entretenimiento" sub="DJ, banda y momentos musicales" cost={costes.musica}>
              <div className="sec-body">
                <SubSec title="DJ">
                  <div className="fr">
                    <Field label="Nombre del DJ" value={R.dj || ''} onChange={v => setR('dj', v)} />
                    <Field label="Horas contratadas" value={R.horasDJ || ''} placeholder="5 h" onChange={v => setR('horasDJ', v)} />
                    <Field label="Coste DJ (€)" type="number" value={R.costeDJ || ''} onChange={v => setR('costeDJ', v)} />
                  </div>
                  <TextArea label="Canciones vetadas" value={R.vetadas || ''} onChange={v => setR('vetadas', v)} />
                </SubSec>
                <SubSec title="Banda / grupo en directo">
                  <div className="fr">
                    <Field label="Nombre del grupo" value={R.banda || ''} onChange={v => setR('banda', v)} />
                    <Field label="Horas contratadas" value={R.horasBanda || ''} placeholder="3 h" onChange={v => setR('horasBanda', v)} />
                    <Field label="Coste banda (€)" type="number" value={R.costeBanda || ''} onChange={v => setR('costeBanda', v)} />
                  </div>
                  <TextArea label="Setlist acordado" value={R.setlist || ''} onChange={v => setR('setlist', v)} />
                </SubSec>
                <SubSec title="Momentos especiales">
                  <div className="fr">
                    <Field label="Canción primer baile" value={R.primerBaile || ''} placeholder="Título - Artista" onChange={v => setR('primerBaile', v)} />
                    <Field label="Baile padre/madre" value={R.bailePadre || ''} placeholder="Título - Artista" onChange={v => setR('bailePadre', v)} />
                  </div>
                  <div className="fr">
                    <Field label="Entrada al banquete" value={R.entradaBanquete || ''} onChange={v => setR('entradaBanquete', v)} />
                    <Field label="Lanzamiento del ramo" value={R.lanzaRamo || ''} onChange={v => setR('lanzaRamo', v)} />
                  </div>
                </SubSec>
              </div>
            </Section>

            <Section id="sec-foto" icon="📷" title="Fotografía y vídeo" sub="Equipos, sesiones y entregas" cost={costes.foto}>
              <div className="sec-body-split">
                <div style={{ padding: 18, borderRight: '1px solid var(--border)' }}>
                  <div className="subsec-title" style={{ marginBottom: 12 }}>Fotógrafo/a</div>
                  <Field label="Nombre" value={R.fotografo || ''} onChange={v => setR('fotografo', v)} />
                  <div className="fr">
                    <Field label="Hora inicio" type="time" value={R.horaFoto || '11:00'} onChange={v => setR('horaFoto', v)} />
                    <Field label="Horas" value={R.horasFoto || ''} placeholder="10 h" onChange={v => setR('horasFoto', v)} />
                  </div>
                  <Field label="Coste (€)" type="number" value={R.costeFoto || ''} onChange={v => setR('costeFoto', v)} />
                  <TextArea label="Entregables / plazo" value={R.entregaFoto || ''} onChange={v => setR('entregaFoto', v)} />
                </div>
                <div style={{ padding: 18 }}>
                  <div className="subsec-title" style={{ marginBottom: 12 }}>Videógrafo/a</div>
                  <Field label="Nombre" value={R.videografo || ''} onChange={v => setR('videografo', v)} />
                  <div className="fr">
                    <Field label="Hora inicio" type="time" value={R.horaVideo || '11:00'} onChange={v => setR('horaVideo', v)} />
                    <Field label="Horas" value={R.horasVideo || ''} placeholder="10 h" onChange={v => setR('horasVideo', v)} />
                  </div>
                  <Field label="Coste (€)" type="number" value={R.costeVideo || ''} onChange={v => setR('costeVideo', v)} />
                  <TextArea label="Entregables / plazo" value={R.entregaVideo || ''} onChange={v => setR('entregaVideo', v)} />
                </div>
              </div>
              <div className="sec-body">
                <div className="fr">
                  <TextArea label="Fotos obligatorias" value={R.fotosOblig || ''} placeholder="Foto con abuelos..." onChange={v => setR('fotosOblig', v)} />
                  <TextArea label="Personas que NO fotografiar" value={R.noFoto || ''} onChange={v => setR('noFoto', v)} />
                </div>
              </div>
            </Section>

            <Section id="sec-transporte" icon="🚌" title="Transporte" sub="Coches y traslados" cost={costes.transporte}>
              <div className="sec-body">
                <div style={{ padding: 14, background: 'var(--ivory2)', borderRadius: 6, marginBottom: 14, fontSize: 13, color: 'var(--muted)' }}>
                  💡 Los autobuses de invitados se gestionan en el <strong>Cronograma</strong>, añadiendo un momento de tipo Autobús.
                </div>
                <SubSec title="Coche nupcial">
                  <div className="fr">
                    <Field label="Empresa / modelo" value={R.cocheNupcial || ''} placeholder="Rolls Royce" onChange={v => setR('cocheNupcial', v)} />
                    <Field label="Trayecto" value={R.trayecto || ''} placeholder="Casa - Ceremonia - Finca" onChange={v => setR('trayecto', v)} />
                    <Field label="Coste (€)" type="number" value={R.costeCoche || ''} onChange={v => setR('costeCoche', v)} />
                  </div>
                </SubSec>
                <SubSec title="Traslado post-boda">
                  <div className="fr">
                    <Field label="Empresa" value={R.traslado || ''} placeholder="Taxi, VTC..." onChange={v => setR('traslado', v)} />
                    <Field label="Hora estimada" type="time" value={R.horaTraslado || '01:00'} onChange={v => setR('horaTraslado', v)} />
                    <Field label="Destino" value={R.destinoTraslado || ''} onChange={v => setR('destinoTraslado', v)} />
                  </div>
                </SubSec>
              </div>
            </Section>

            <Section id="sec-alojamiento" icon="🏨" title="Alojamiento" sub="Noche de bodas e invitados" cost={costes.alojamiento}>
              <div className="sec-body-split">
                <div style={{ padding: 18, borderRight: '1px solid var(--border)' }}>
                  <div className="subsec-title" style={{ marginBottom: 12 }}>Noche de bodas</div>
                  <Field label="Hotel" value={R.hotelNovios || ''} onChange={v => setR('hotelNovios', v)} />
                  <Field label="Tipo de habitación" value={R.tipoHab || ''} placeholder="Suite nupcial" onChange={v => setR('tipoHab', v)} />
                  <Field label="Coste (€)" type="number" value={R.costeHotel || ''} onChange={v => setR('costeHotel', v)} />
                  <Field label="Extras" value={R.extrasHotel || ''} placeholder="Pétalos, champán..." onChange={v => setR('extrasHotel', v)} />
                </div>
                <div style={{ padding: 18 }}>
                  <div className="subsec-title" style={{ marginBottom: 12 }}>Alojamiento invitados</div>
                  <Field label="Hotel recomendado" value={R.hotelInv || ''} onChange={v => setR('hotelInv', v)} />
                  <Field label="Habitaciones reservadas" value={R.habReservadas || ''} placeholder="20 habitaciones" onChange={v => setR('habReservadas', v)} />
                  <Field label="Precio negociado / noche" value={R.precioHab || ''} onChange={v => setR('precioHab', v)} />
                  <Field label="Código de reserva" value={R.codigoHab || ''} onChange={v => setR('codigoHab', v)} />
                </div>
              </div>
            </Section>

            <div className="sec-block" id="sec-proveedores">
              <div className="sec-head">
                <div className="sec-head-left">
                  <span className="sec-icon">📋</span>
                  <div>
                    <div className="sec-title">Directorio de proveedores</div>
                    <div className="sec-subtitle">Todos los contactos en un lugar</div>
                  </div>
                </div>
                <button className="btn-primary-sm" onClick={() => setProvModal(true)}>+ Añadir proveedor</button>
              </div>
              <div className="sec-body">
                {data.proveedores.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: 24 }}>
                    Añade tus proveedores
                  </div>
                ) : data.proveedores.map(p => (
                  <div key={p.id} className="prov-card">
                    <div className="prov-icon">📋</div>
                    <div className="prov-info">
                      <div className="prov-tipo">{p.tipo}</div>
                      <div className="prov-nombre">{p.nombre}</div>
                      <div className="prov-contacto">
                        {p.contacto}{p.precio ? ` · ${p.precio.toLocaleString('es-ES')} €` : ''}
                      </div>
                      {p.notas && <div className="prov-contacto" style={{ fontStyle: 'italic' }}>{p.notas}</div>}
                    </div>
                    <div className={`prov-status ps-${p.status}`}>
                      {p.status === 'confirmado' ? 'Confirmado' : p.status === 'pendiente' ? 'En negociación' : 'Buscando'}
                    </div>
                    <button className="btn-ghost" onClick={() => deleteProv(p.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <Section id="sec-presupuesto" icon="💰" title="Presupuesto total" sub="Resumen económico">
              <div className="sec-body">
                <div className="bov">
                  <BovItem val={presupuesto} label="Previsto" />
                  <BovItem val={totalConfirmado} label="Confirmado" />
                  <BovItem val={Math.max(0, presupuesto - totalConfirmado)} label="Pendiente" />
                  <BovItem val={recaudado} label="En sobres" />
                </div>
                <Field label="Presupuesto total estimado (€)" type="number" value={R.presupuesto || ''}
                  placeholder="30000" onChange={v => setR('presupuesto', v)} />
                <TextArea label="Notas económicas" value={R.notasEco || ''} onChange={v => setR('notasEco', v)} />
              </div>
            </Section>

            <div className="sec-block" id="sec-checklist">
              <div className="sec-head">
                <div className="sec-head-left">
                  <span className="sec-icon">✓</span>
                  <div>
                    <div className="sec-title">Checklist de la boda perfecta</div>
                    <div className="sec-subtitle">Tareas ordenadas cronológicamente</div>
                  </div>
                </div>
              </div>
              <div className="sec-body">
                <div className="check-progress">
                  <div>
                    <div className="check-pct">{ckPct}%</div>
                    <div className="check-label">{ckDone} de {data.checklist.length} completadas</div>
                  </div>
                  <div className="check-bar-bg">
                    <div className="check-bar-fill" style={{ width: `${ckPct}%` }} />
                  </div>
                </div>
                <div className="check-filters">
                  {(['all', 'pendiente', 'hecho', 'urgente'] as const).map(f => (
                    <div key={f} className={`filter-chip ${ckFilter === f ? 'active' : ''}`}
                      onClick={() => setCkFilter(f)}>
                      {f === 'all' ? 'Todas' : f === 'pendiente' ? 'Pendientes' : f === 'hecho' ? 'Completadas' : 'Urgentes'}
                    </div>
                  ))}
                </div>
                {ckOrder.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 28, color: 'var(--muted)', fontStyle: 'italic' }}>
                    No hay tareas con este filtro
                  </div>
                ) : ckOrder.map(grupo => {
                  const items = ckGroups[grupo]
                  const gd = items.filter(c => c.done).length
                  return (
                    <div key={grupo} className="check-month">
                      <div className="month-title">
                        <span>{grupo.toUpperCase()}</span>
                        <span style={{ fontWeight: 400, color: 'var(--muted2)' }}>{gd}/{items.length}</span>
                      </div>
                      {items.map(c => (
                        <div key={c.id} className={`check-item ${c.done ? 'done' : c.p}`}
                          onClick={() => toggleCheck(c.id)}>
                          <div className="check-box">{c.done ? '✓' : ''}</div>
                          <div className="check-info">
                            <div className="check-name">{c.n}</div>
                            <div className="check-meta">
                              <span className="check-when">{c.c}</span>
                              <span className={`check-tag tag-${c.p}`}>
                                {c.p === 'urgente' ? 'Urgente' : c.p === 'pronto' ? 'Pronto' : 'Normal'}
                              </span>
                            </div>
                            {c.nota && <div className="check-notas">{c.nota}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {provModal && (
        <ProveedorModal
          onClose={() => setProvModal(false)}
          onSave={(p) => {
            setData(d => ({ ...d, proveedores: [...d.proveedores, { ...p, id: d.pvid }], pvid: d.pvid + 1 }))
            setProvModal(false)
            showToast('Proveedor añadido')
          }}
        />
      )}
    </div>
  )
}

/* ═══ SUBCOMPONENTES ═══ */
function Section({ id, icon, title, sub, cost, children }: {
  id: string; icon: string; title: string; sub: string; cost?: number; children: React.ReactNode
}) {
  return (
    <div className="sec-block" id={id}>
      <div className="sec-head">
        <div className="sec-head-left">
          <span className="sec-icon">{icon}</span>
          <div>
            <div className="sec-title">{title}</div>
            <div className="sec-subtitle">{sub}</div>
          </div>
        </div>
        {cost !== undefined && (
          <div className="cost-badge">{cost > 0 ? `${cost.toLocaleString('es-ES')} €` : '— €'}</div>
        )}
      </div>
      {children}
    </div>
  )
}

function SubSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="subsec">
      <div className="subsec-head"><div className="subsec-title">{title}</div></div>
      <div className="subsec-body">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div className="fg">
      <label className="fl">{label}</label>
      <input className="fi2" type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div className="fg">
      <label className="fl">{label}</label>
      <select className="fs2" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="fg">
      <label className="fl">{label}</label>
      <textarea className="ft2" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function Toggle({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        {sub && <div className="toggle-sublabel">{sub}</div>}
      </div>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  )
}

function BovItem({ val, label }: { val: number; label: string }) {
  return (
    <div className="bov-item">
      <div className="bov-val">{val.toLocaleString('es-ES')} €</div>
      <div className="bov-key">{label}</div>
    </div>
  )
}

function ItemList({ title, list, data, onAdd, onUpd, onDel }: {
  title: string; list: string; data: BodaData
  onAdd: (l: string) => void
  onUpd: (l: string, id: number, t: string) => void
  onDel: (l: string, id: number) => void
}) {
  const items = data.rItems[list] || []
  return (
    <div className="subsec">
      <div className="subsec-head">
        <div className="subsec-title">{title}</div>
        <button className="btn-ghost" onClick={() => onAdd(list)}>+ Añadir</button>
      </div>
      <div className="subsec-body">
        <div className="items-list">
          {items.map(i => (
            <div key={i.id} className="item-row">
              <span className="item-emoji">•</span>
              <input className="item-input" value={i.text} placeholder="Escribe aquí..."
                onChange={e => onUpd(list, i.id, e.target.value)} />
              <button className="item-del" onClick={() => onDel(list, i.id)}>×</button>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted2)', fontStyle: 'italic', padding: 6 }}>
              Sin elementos
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProveedorModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (p: Omit<Proveedor, 'id'>) => void
}) {
  const [tipo, setTipo] = useState('Finca / Espacio')
  const [nombre, setNombre] = useState('')
  const [contacto, setContacto] = useState('')
  const [precio, setPrecio] = useState('')
  const [status, setStatus] = useState<Proveedor['status']>('confirmado')
  const [notas, setNotas] = useState('')

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Nuevo proveedor</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label className="modal-label">Tipo</label>
            <select className="modal-select" value={tipo} onChange={e => setTipo(e.target.value)}>
              {['Finca / Espacio', 'Catering', 'Pastelería', 'Fotógrafo/a', 'Videógrafo/a', 'DJ',
                'Banda / grupo', 'Florista', 'Maquilladora', 'Peluquería', 'Vestido de novia',
                'Traje de novio', 'Transporte', 'Hotel', 'Papelería', 'Oficiante', 'Regalos', 'Otro']
                .map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Nombre / Empresa</label>
              <input className="modal-input" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Contacto</label>
              <input className="modal-input" value={contacto} onChange={e => setContacto(e.target.value)} />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Presupuesto (€)</label>
              <input className="modal-input" type="number" value={precio} onChange={e => setPrecio(e.target.value)} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Estado</label>
              <select className="modal-select" value={status}
                onChange={e => setStatus(e.target.value as Proveedor['status'])}>
                <option value="confirmado">Confirmado</option>
                <option value="pendiente">En negociación</option>
                <option value="buscando">Buscando</option>
              </select>
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">Notas</label>
            <input className="modal-input" value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={() => {
            if (!nombre.trim()) return
            onSave({ tipo, nombre: nombre.trim(), contacto: contacto.trim(), precio: parseFloat(precio) || 0, status, notas: notas.trim() })
          }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}