import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const params = await searchParams

  // Enlaces de confirmación de email que llegan a la raíz
  if (params.code) redirect(`/auth/callback?code=${params.code}`)

  // Cualquiera puede entrar y probar la app sin cuenta
  redirect('/app')
}
