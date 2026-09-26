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
      <div className="paywall-box">
        <button className="paywall-close" onClick={onClose}>×</button>

        <div className="paywall-top">
          <div className="paywall-icon">💍</div>
          <h2 className="paywall-headline">Desbloquea Enlace</h2>
          <p className="paywall-sub">Elige el plan que se adapta a tu boda</p>
        </div>

        <div className="paywall-plans">

          {/* PLAN COMPLETO */}
          <div className={`paywall-plan ${tier === 'pro' ? 'highlighted' : ''}`}>
            <div className="plan-badge-row">
              <span className="plan-name">Plan completo</span>
              {tier === 'pro' && <span className="plan-rec">Recomendado</span>}
            </div>
            <div className="plan-price">
              <span className="plan-cur">€</span>
              <span className="plan-amount">3<span className="plan-cents">,99</span></span>
            </div>
            <div className="plan-once">Pago único · Sin suscripción</div>
            <ul className="plan-features">
              <li><span>✓</span> Invitados y mesas sin límite</li>
              <li><span>✓</span> Plano del salón interactivo</li>
              <li><span>✓</span> Cronograma completo</li>
              <li><span>✓</span> Resumen general completo</li>
              <li><span>✓</span> Comparador de fincas con puntuaciones</li>
              <li><span>✓</span> Checklist de 52 tareas</li>
            </ul>
            <a className="plan-btn" href={PLAN_COMPLETO} target="_blank" rel="noopener noreferrer">
              Conseguir por 3,99 €
            </a>
          </div>

          {/* PLAN PREMIUM */}
          <div className={`paywall-plan premium ${tier === 'premium' ? 'highlighted' : ''}`}>
            <div className="plan-badge-row">
              <span className="plan-name">Plan premium</span>
              {tier === 'premium' && <span className="plan-rec">Lo que necesitas</span>}
            </div>
            <div className="plan-price">
              <span className="plan-cur">€</span>
              <span className="plan-amount">9<span className="plan-cents">,99</span></span>
            </div>
            <div className="plan-once">Pago único · Todo incluido</div>
            <ul className="plan-features">
              <li><span>✓</span> Todo lo del Plan completo</li>
              <li><span className="gold">✦</span> Invitación digital personalizada</li>
              <li><span className="gold">✦</span> 5 estilos visuales distintos</li>
              <li><span className="gold">✦</span> Fotos propias en la invitación</li>
              <li><span className="gold">✦</span> Confirmaciones automáticas de asistencia</li>
              <li><span className="gold">✦</span> Descarga del plano de mesas en PDF</li>
            </ul>
            <a className="plan-btn gold-btn" href={PLAN_PREMIUM} target="_blank" rel="noopener noreferrer">
              Conseguir por 9,99 €
            </a>
          </div>

        </div>

        <p className="paywall-legal">
          Pago único y seguro. Acceso de por vida. Sin renovaciones automáticas.
        </p>
      </div>
    </div>
  )
}