import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) return new Response('No signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] Firma no válida:', err)
    return new Response('Webhook error', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const amount = session.amount_total ?? 0 // en céntimos
    const userId = session.client_reference_id
    const email = session.customer_details?.email

    // 9,99 € = premium (incluye todo) · 3,99 € = plan completo
    const updates: Record<string, boolean> =
      amount >= 999 ? { is_pro: true, is_premium: true }
      : amount >= 399 ? { is_pro: true }
      : {}
    if (!Object.keys(updates).length) return new Response('OK', { status: 200 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Primero por la cuenta que inició el pago; si no viene, por el email
    let actualizado = false
    if (userId && UUID.test(userId)) {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select('id')
      if (error) console.error('[webhook] Error por id:', error)
      actualizado = !!data?.length
    }
    if (!actualizado && email) {
      const { data, error } = await supabase.from('profiles').update(updates).ilike('email', email).select('id')
      if (error) console.error('[webhook] Error por email:', error)
      actualizado = !!data?.length
    }
    console.log('[webhook]', actualizado ? 'Plan activado' : 'Sin cuenta encontrada', { userId, email, updates })
  }

  return new Response('OK', { status: 200 })
}
