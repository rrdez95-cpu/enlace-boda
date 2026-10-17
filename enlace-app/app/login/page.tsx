import { redirect } from 'next/navigation'

// Ya no hay pantalla de acceso suelta: se entra a la app y el acceso se abre encima
export default function LoginPage() {
  redirect('/app?entrar=1')
}
