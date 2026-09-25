'use client'

import { BodaData } from '@/lib/types'

type Tab = 'inicio' | 'fincas' | 'mesas' | 'plano' | 'crono' | 'resumen'

type Props = {
  data: BodaData
  userName: string
  isPro: boolean
  onPaywall: () => void
  onGoTab: (t: Tab) => void
}

export default function TabInicio({ data, userName, isPro, onPaywall, onGoTab }: Props) {
  const nombres = data.resumen?.novios
  const fecha = data.resumen?.fecha

  let diasTexto = ''
  if (fecha) {
    const d = new Date(fecha)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d.getTime() - hoy.getTime()) / 86400000)
    diasTexto = diff > 0
      ? `Faltan ${diff} ${diff === 1 ? 'día' : 'días'}`
      : diff === 0 ? '¡Hoy es el día!' : ''
  }

  return (
    <div className="home-scroll">

      {/* HERO */}
      <section className="hero">
        <div className="hero-img" />
        <div className="hero-veil" />
        <div className="hero-content">
          <div className="hero-mark">EN<span>·</span>LACE</div>
          <div className="hero-tagline">Organiza tu boda sin perder la cabeza</div>
          {(nombres || diasTexto) && (
            <div className="hero-meta">
              {nombres && <span>{nombres}</span>}
              {nombres && diasTexto && <span className="hero-dot">·</span>}
              {diasTexto && <span>{diasTexto}</span>}
            </div>
          )}
        </div>
      </section>

      {/* INTRO */}
      <section className="home-intro">
        <div className="home-eyebrow">Bienvenida, {userName}</div>
        <h1 className="home-title">
          Todo lo que necesitas,<br /><em>en un solo lugar</em>
        </h1>
        <p className="home-lead">
          Organizar una boda son cientos de decisiones repartidas entre notas del móvil,
          hojas de cálculo y grupos de WhatsApp. Enlace las reúne todas en un sitio
          para que dejes de improvisar y disfrutes del proceso.
        </p>
      </section>

      {/* PASOS */}
      <section className="home-steps">
        <div className="home-steps-head">
          <div className="home-eyebrow">Cómo funciona</div>
          <h2 className="home-h2">Cinco espacios, una boda perfecta</h2>
        </div>

        <StepCard
          num="01"
          icon="🌿"
          title="Comparador de fincas"
          badge="Incluido"
          badgeType="free"
          desc="Compara todas las fincas que visites sin Excel. Coste total, precio por invitado calculado automáticamente y puntuación de cada apartado para decidir sin dudas."
          perks={[
            'Precio real por invitado con todos los extras sumados',
            'Extras con precio fijo o por persona (exclusividades, corners...)',
            'Comparativa entre lo esperado y lo que viste en persona',
          ]}
          perksPro={['Puntuación de cada apartado del 1 al 10', 'Nota media por finca para comparar de un vistazo']}
          isPro={isPro}
          locked={false}
          onClick={() => onGoTab('fincas')}
        />

        <StepCard
          num="02"
          icon="⬡"
          title="Mesas e invitados"
          badge="Incluido"
          badgeType="free"
          desc="Añade a tus invitados y colócalos en las mesas arrastrando con el dedo. Controla quién ha entregado el sobre y recoge intolerancias para el catering."
          perks={[
            'Arrastra y suelta para mover invitados entre mesas',
            'Aviso automático si una mesa se llena',
            'Las intolerancias se recopilan solas para el catering',
          ]}
          isPro={isPro}
          locked={false}
          onClick={() => onGoTab('mesas')}
        />

        <StepCard
          num="03"
          icon="□"
          title="Plano del salón"
          badge={isPro ? 'Desbloqueado' : 'Plan completo'}
          badgeType={isPro ? 'pro' : 'locked'}
          desc="Coloca cada mesa exactamente donde va a estar el día de la boda sobre un plano con aspecto de proyecto de arquitecto. Los asientos se marcan solos."
          perks={[
            'Mueve las mesas libremente por el salón',
            'Mesas redondas o rectangulares',
            'Listo para enseñárselo a la finca',
          ]}
          isPro={isPro}
          locked={!isPro}
          onClick={() => isPro ? onGoTab('plano') : onPaywall()}
        />

        <StepCard
          num="04"
          icon="◷"
          title="Cronograma del día"
          badge="Incluido"
          badgeType="free"
          desc="El guion minuto a minuto de tu boda. Ceremonia, fotos, cóctel, banquete, primer baile. Cada momento con su hora, su duración y sus notas."
          perks={[
            'Línea de tiempo visual por categorías',
            'Gestión de autobuses con rutas y pasajeros',
            'Compártelo con todos tus proveedores',
          ]}
          isPro={isPro}
          locked={false}
          onClick={() => onGoTab('crono')}
        />

        <StepCard
          num="05"
          icon="✦"
          title="Resumen general"
          badge={isPro ? 'Desbloqueado' : 'Fecha gratis'}
          badgeType={isPro ? 'pro' : 'partial'}
          desc="El cuaderno de una wedding planner profesional. Ceremonia, cóctel, banquete, música, foto, transporte, alojamiento, proveedores y presupuesto con balance de sobres."
          perks={[
            'Checklist de 52 tareas ordenadas en el tiempo',
            'Presupuesto que se calcula solo por sección',
            'Balance final: lo que os ha costado la boda de verdad',
          ]}
          isPro={isPro}
          locked={false}
          onClick={() => onGoTab('resumen')}
        />
      </section>

      {/* CTA */}
      {!isPro && (
        <section className="home-cta">
          <div className="home-cta-box">
            <div className="home-cta-rings">💍</div>
            <h3 className="home-cta-title">Desbloquea <em>Enlace</em> al completo</h3>
            <p className="home-cta-text">
              Puntuaciones en el comparador de fincas, plano del salón, cronograma sin límite
              y el resumen completo de wedding planner con checklist de 52 tareas.
            </p>
            <div className="home-cta-price">
              <span className="home-cta-cur">€</span>
              <span className="home-cta-amount">3<span className="home-cta-cents">,99</span></span>
            </div>
            <div className="home-cta-once">Pago único · Para siempre · Sin suscripción</div>
            <button className="home-cta-btn" onClick={onPaywall}>
              Ver qué incluye →
            </button>
          </div>
        </section>
      )}

      <footer className="home-footer">
        <div className="home-footer-mark">EN<span>·</span>LACE</div>
        <div className="home-footer-text">Hecho para que el día más importante salga como lo has imaginado.</div>
      </footer>

    </div>
  )
}

function StepCard({ num, icon, title, badge, badgeType, desc, perks, perksPro, isPro, locked, onClick }: {
  num: string
  icon: string
  title: string
  badge: string
  badgeType: 'free' | 'pro' | 'locked' | 'partial'
  desc: string
  perks: string[]
  perksPro?: string[]
  isPro: boolean
  locked: boolean
  onClick: () => void
}) {
  return (
    <div className={`step-card ${locked ? 'locked' : ''}`} onClick={onClick}>
      <div className="step-num">{num}</div>
      <div className="step-body">
        <div className="step-head">
          <span className="step-icon">{icon}</span>
          <span className="step-title">{title}</span>
          <span className={`step-badge b-${badgeType}`}>{badge}</span>
        </div>
        <p className="step-desc">{desc}</p>
        <ul className="step-perks">
          {perks.map((p, i) => (
            <li key={i}><span className="step-tick">✓</span>{p}</li>
          ))}
          {perksPro && perksPro.map((p, i) => (
            <li key={'pro' + i} className={isPro ? '' : 'perk-locked'}>
              <span className="step-tick">{isPro ? '✓' : '🔒'}</span>{p}
            </li>
          ))}
        </ul>
        <div className="step-go">
          {locked ? 'Desbloquear →' : 'Entrar →'}
        </div>
      </div>
    </div>
  )
}