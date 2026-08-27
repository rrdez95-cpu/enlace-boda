import { createClient } from '@/lib/supabase-server'
import EnlaceApp from './enlace-app'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24, fontFamily: 'monospace',
        background: '#1c1c1e', color: '#e8cfa0'
      }}>
        <div style={{ maxWidth: 500, fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ fontSize: 18, marginBottom: 16, color: '#b8965a' }}>
            SIN SESIÓN EN EL SERVIDOR
          </div>
          <div>Error: {error?.message || 'ninguno'}</div>
          <div>Código: {error?.status || '—'}</div>
          <div style={{ marginTop: 20 }}>
            <a href="/login" style={{ color: '#b8965a' }}>Volver al login</a>
          </div>
        </div>
      </div>
    )
  }

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