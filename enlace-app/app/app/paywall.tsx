'use client'

type Props = {
  tier: 'pro' | 'premium'
  onClose: () => void
  userId: string
}

const PLAN_COMPLETO = 'https://buy.stripe.com/7sY3cn6nC8xDaMg4rj33W00'
const PLAN_PREMIUM  = 'https://buy.stripe.com/fZu9AL4fudRX5rWaPH33W01'

export default function Paywall({ tier, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pw-box">
        <button className="pw-close" onClick={onClose}>×</button>

        <div className="pw-top">
          <div className="pw-icon">💍</div>
          <h2 className="pw-title">Desbloquea Enlace</h2>
          <p className="pw-subtitle">Elige el plan que se adapta a tu boda</p>
        </div>

        <div className="pw-plans">

          {/* PLAN COMPLETO — fondo marfil */}
          <div className={`pw-plan ivory ${tier === 'pro' ? 'highlighted' : ''}`}>
            <div className="pw-plan-head">
              <span className="pw-plan-name">Plan completo</span>
              {tier === 'pro' && <span className="pw-plan-tag ivory-tag">Recomendado</span>}
            </div>
            <div className="pw-price">
              <span className="pw-cur ivory-cur">€</span>
              <span className="pw-amount ivory-amount">3<span className="pw-cents">,99</span></span>
            </div>
            <p className="pw-once ivory-once">Pago único · Sin suscripción</p>
            <ul className="pw-features">
              <li><span className="pw-tick ivory-tick">✓</span>Invitados y mesas sin límite</li>
              <li><span className="pw-tick ivory-tick">✓</span>Plano del salón interactivo</li>
              <li><span className="pw-tick ivory-tick">✓</span>Cronograma completo</li>
              <li><span className="pw-tick ivory-tick">✓</span>Resumen general completo</li>
              <li><span className="pw-tick ivory-tick">✓</span>Comparador de fincas con puntuaciones</li>
              <li><span className="pw-tick ivory-tick">✓</span>Checklist de 52 tareas</li>
            </ul>
            <a className="pw-btn ivory-btn" href={PLAN_COMPLETO} target="_blank" rel="noopener noreferrer">
              Conseguir por 3,99 €
            </a>
          </div>

          {/* PLAN PREMIUM — fondo dorado */}
          <div className={`pw-plan gold ${tier === 'premium' ? 'highlighted' : ''}`}>
            <div className="pw-plan-head">
              <span className="pw-plan-name gold-name">Plan premium</span>
              {tier === 'premium' && <span className="pw-plan-tag gold-tag">Lo que necesitas</span>}
            </div>
            <div className="pw-price">
              <span className="pw-cur gold-cur">€</span>
              <span className="pw-amount gold-amount">9<span className="pw-cents">,99</span></span>
            </div>
            <p className="pw-once gold-once">Pago único · Todo incluido</p>
            <ul className="pw-features">
              <li><span className="pw-tick gold-tick">✓</span><span className="gold-feat-text">Todo lo del Plan completo</span></li>
              <li><span className="pw-tick gold-tick">✦</span><span className="gold-feat-text">Invitación digital personalizada</span></li>
              <li><span className="pw-tick gold-tick">✦</span><span className="gold-feat-text">5 estilos visuales distintos</span></li>
              <li><span className="pw-tick gold-tick">✦</span><span className="gold-feat-text">Fotos propias en la invitación</span></li>
              <li><span className="pw-tick gold-tick">✦</span><span className="gold-feat-text">Confirmaciones automáticas</span></li>
              <li><span className="pw-tick gold-tick">✦</span><span className="gold-feat-text">Descarga del plano de mesas en PDF</span></li>
            </ul>
            <a className="pw-btn gold-btn" href={PLAN_PREMIUM} target="_blank" rel="noopener noreferrer">
              Conseguir por 9,99 €
            </a>
          </div>

        </div>

        <p className="pw-legal">Pago único y seguro · Acceso de por vida · Sin renovaciones automáticas</p>
      </div>
    </div>
  )
}