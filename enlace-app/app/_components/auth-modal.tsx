'use client'

import './auth.css'
import { useEffect } from 'react'
import AuthForm from './auth-form'

export type MotivoRegistro = 'guardar' | 'pagar' | 'publicar' | 'login'

const TEXTOS: Record<MotivoRegistro, { titulo: string; sub: string }> = {
  guardar: {
    titulo: 'Guarda tu boda',
    sub: 'Crea tu cuenta gratis y todo lo que has hecho se queda guardado, en el móvil y en el ordenador.',
  },
  pagar: {
    titulo: 'Primero, crea tu cuenta',
    sub: 'Así el plan que compres queda guardado en tu cuenta para siempre. Lo que ya has hecho se mantiene.',
  },
  publicar: {
    titulo: 'Crea tu cuenta para publicar',
    sub: 'Tu invitación necesita una cuenta para tener su propio enlace y recibir las respuestas de tus invitados.',
  },
  login: {
    titulo: 'Accede a tu boda',
    sub: 'Entra con tu cuenta para seguir donde lo dejaste.',
  },
}

export default function AuthModal({ motivo, onClose }: { motivo: MotivoRegistro; onClose: () => void }) {
  const t = TEXTOS[motivo]

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="au-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="au-card" role="dialog" aria-modal="true" aria-labelledby="au-title">
        <div className="au-head">
          <button className="au-close" onClick={onClose} aria-label="Cerrar">×</button>
          <div className="au-logo">EN<span>·</span>LACE</div>
          <h2 className="au-title" id="au-title">{t.titulo}</h2>
          <p className="au-sub">{t.sub}</p>
        </div>
        <div className="au-body">
          {motivo !== 'login' && (
            <ul className="au-perks">
              <li>Gratis, sin tarjeta</li>
              <li>Lo que llevas hecho pasa a tu cuenta</li>
              <li>Tu boda en el móvil y en el ordenador</li>
            </ul>
          )}
          <AuthForm modoInicial={motivo === 'login' ? 'login' : 'signup'} />
        </div>
      </div>
    </div>
  )
}
