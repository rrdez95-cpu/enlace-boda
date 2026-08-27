'use client'

import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={logout}
      style={{
        width: '100%', padding: 12, background: 'transparent',
        color: '#8b3a3a', border: '1px solid rgba(139,58,58,.3)',
        borderRadius: 8, fontSize: 13, cursor: 'pointer',
        fontFamily: 'Barlow, sans-serif',
      }}
    >
      Cerrar sesión
    </button>
  )
}