import Link from 'next/link'
import AuthForm from '../_components/auth-form'

export default function LoginPage() {
  return (
    <div className="au-page">
      <div className="au-card">
        <div className="au-head">
          <div className="au-logo">EN<span>·</span>LACE</div>
          <h1 className="au-title">Accede a tu boda</h1>
          <p className="au-sub">Mesas, invitados, cronograma, fincas e invitación digital en un solo sitio.</p>
        </div>
        <div className="au-body">
          <AuthForm modoInicial="login" />
        </div>
      </div>
      <Link className="au-guest" href="/app">Probar Enlace sin registrarme</Link>
    </div>
  )
}
