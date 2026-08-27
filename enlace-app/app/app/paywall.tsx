'use client'

const STRIPE_LINK = 'https://buy.stripe.com/7sY3cn6nC8xDaMg4rj33W00'

export default function Paywall({ onClose }: { onClose: () => void }) {
  function pay() {
    window.location.href = STRIPE_LINK
  }

  return (
    <div className="paywall-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="paywall-box">
        <div className="paywall-top">
          <span className="paywall-rings">💍</span>
          <div className="paywall-title">Desbloquea <em>Enlace</em><br />al completo</div>
          <div className="paywall-sub">
            Mesas ilimitadas, plano del salón,<br />cronograma completo y resumen general
          </div>
        </div>
        <div className="paywall-price">
          <span className="paywall-currency">€</span>
          <span className="paywall-amount">3<span style={{ fontSize: 32 }}>,99</span></span>
        </div>
        <div className="paywall-once">Pago único · Para siempre · Sin suscripción</div>
        <div className="paywall-features">
          <Feat>Invitados y mesas ilimitadas</Feat>
          <Feat>Plano del salón con editor visual</Feat>
          <Feat>Cronograma sin límite de momentos</Feat>
          <Feat>Resumen general de wedding planner</Feat>
          <Feat>Checklist de 52 tareas profesionales</Feat>
          <Feat>Sincronizado en todos tus dispositivos</Feat>
          <Feat>Tus datos guardados para siempre</Feat>
        </div>
        <button className="paywall-cta" onClick={pay}>
          Desbloquear por 3,99 € →
        </button>
        <div className="paywall-guarantee">🔒 Pago seguro · Satisfacción garantizada</div>
        <div className="paywall-skip" onClick={onClose}>Continuar con el plan gratuito</div>
      </div>
    </div>
  )
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <div className="pf-item">
      <span className="pf-check">✓</span>{children}
    </div>
  )
}