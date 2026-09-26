import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return new Response('No signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] Invalid signature:', err)
    return new Response('Webhook error', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email
    const amount = session.amount_total // en céntimos

    if (!email) return new Response('OK', { status: 200 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 399 = Plan completo (3,99€) → is_pro
    // 999 = Plan premium (9,99€) → is_premium + is_pro (incluye todo)
    const updates: Record<string, boolean> = {}
    if (amount === 399) {
      updates.is_pro = true
    } else if (amount === 999) {
      updates.is_pro = true
      updates.is_premium = true
    }

    if (Object.keys(updates).length === 0) {
      return new Response('OK', { status: 200 })
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('email', email)

    if (error) console.error('[webhook] DB error:', error)
    else console.log('[webhook] Updated', email, updates)
  }

  return new Response('OK', { status: 200 })
}