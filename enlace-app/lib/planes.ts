/* Planes de pago: un único sitio para precios, enlaces de Stripe y lo que incluye cada uno */

export type PlanId = 'pro' | 'premium'

export const PLANES: Record<PlanId, { nombre: string; precio: string; url: string; incluye: string[] }> = {
  pro: {
    nombre: 'Plan completo',
    precio: '3,99',
    url: 'https://buy.stripe.com/7sY3cn6nC8xDaMg4rj33W00',
    incluye: [
      'Invitados y mesas sin límite',
      'Plano del salón con todas tus mesas',
      'Cronograma sin límite de momentos',
      'Resumen completo con presupuesto y checklist de 52 tareas',
      'Puntuaciones en el comparador de fincas',
    ],
  },
  premium: {
    nombre: 'Plan premium',
    precio: '9,99',
    url: 'https://buy.stripe.com/fZu9AL4fudRX5rWaPH33W01',
    incluye: [
      'Invitación digital con 5 estilos y vuestras fotos',
      'Confirmaciones de asistencia que pasan solas a tus mesas',
      'Tarjetas de mesa para imprimir, con 8 diseños',
    ],
  },
}

/** Enlace de pago con la cuenta identificada, para que el plan se active aunque pague con otro email */
export function enlacePago(plan: PlanId, userId?: string | null, email?: string | null): string {
  const u = new URL(PLANES[plan].url)
  if (userId) u.searchParams.set('client_reference_id', userId)
  if (email) u.searchParams.set('prefilled_email', email)
  return u.toString()
}
