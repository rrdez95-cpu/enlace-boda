import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import EnlaceApp from './enlace-app'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, is_pro')
    .eq('id', user.id)
    .single()

  return (
    <EnlaceApp
      userId={user.id}
      userName={profile?.nombre || user.email?.split('@')[0] || 'Usuario'}
      isPro={profile?.is_pro || false}
    />
  )
}