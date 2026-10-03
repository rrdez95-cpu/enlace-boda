'use client'

import { PLANES, enlacePago } from '@/lib/planes'

type Props = {
  tier: 'pro' | 'premium'
  onClose: () => void
  userId: string
  userEmail?: string
}

export default function Paywall({ tier, onClose, userId, userEmail }: Props) {
  const pro = PLANES.pro, premium = PLANES.premium
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pw-box">
        <button className="pw-close" onClick={onClose}>×</button>

        <div className="pw-top">
          <div className="pw-icon">💍</div>
          <h2 className="pw-title">Desbloquea Enlace</h2>
          <p className="pw-subtitle">Pago único. Elige y te llevamos directamente al pago</p>
        </div>

        <div className="pw-plans">
          <div className={`pw-plan ivory ${tier === 'pro' ? 'highlighted' : ''}`}>
            <div className="pw-plan-head">
              <span className="pw-plan-name">{pro.nombre}</span>
              {tier === 'pro' && <span className="pw-plan-tag ivory-tag">Recomendado</span>}
            </div>
            <div className="pw-price">
              <span className="pw-cur ivory-cur">€</span>
              <span className="pw-amount ivory-amount">{pro.precio.split(',')[0]}<span className="pw-cents">,{pro.precio.split(',')[1]}</span></span>
            </div>
            <p className="pw-once ivory-once">Pago único · Sin suscripción</p>
            <ul className="pw-features">
              {pro.incluye.map(t => <li key={t}><span className="pw-tick ivory-tick">✓</span>{t}</li>)}
            </ul>
            <a className="pw-btn ivory-btn" href={enlacePago('pro', userId, userEmail)}>Comprar por {pro.precio} €</a>
          </div>

          <div className={`pw-plan gold ${tier === 'premium' ? 'highlighted' : ''}`}>
            <div className="pw-plan-head">
              <span className="pw-plan-name gold-name">{premium.nombre}</span>
              {tier === 'premium' && <span className="pw-plan-tag gold-tag">Lo que necesitas</span>}
            </div>
            <div className="pw-price">
              <span className="pw-cur gold-cur">€</span>
              <span className="pw-amount gold-amount">{premium.precio.split(',')[0]}<span className="pw-cents">,{premium.precio.split(',')[1]}</span></span>
            </div>
            <p className="pw-once gold-once">Pago único · Todo incluido</p>
            <ul className="pw-features">
              <li><span className="pw-tick gold-tick">✓</span><span className="gold-feat-text">Todo lo del plan completo</span></li>
              {premium.incluye.map(t => <li key={t}><span className="pw-tick gold-tick">✦</span><span className="gold-feat-text">{t}</span></li>)}
            </ul>
            <a className="pw-btn gold-btn" href={enlacePago('premium', userId, userEmail)}>Comprar por {premium.precio} €</a>
          </div>
        </div>

        <p className="pw-legal">Pago seguro con Stripe · Acceso de por vida · Sin renovaciones automáticas</p>
      </div>
    </div>
  )
}
