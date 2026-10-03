import { createClient } from '@/lib/supabase-server'
import EnlaceApp from './enlace-app'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sin cuenta: la app funciona igual y guarda en el navegador
  if (!user) {
    return <EnlaceApp userId={null} bodaId="" userName="" isPro={false} isPremium={false} />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, is_pro, is_premium')
    .eq('id', user.id)
    .single()

  const { data: boda } = await supabase
    .from('bodas')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <EnlaceApp
      userId={user.id}
      bodaId={boda?.id || ''}
      userName={profile?.nombre || user.email?.split('@')[0] || ''}
      userEmail={user.email || ''}
      isPro={profile?.is_pro || false}
      isPremium={profile?.is_premium || false}
    />
  )
}
