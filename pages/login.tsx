import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const redirectTarget = typeof router.query.redirect === 'string' ? router.query.redirect : '/books'
  const { login, isAuthenticated, initializing } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [showTotp, setShowTotp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      router.replace(redirectTarget)
    }
  }, [initializing, isAuthenticated, redirectTarget, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password, totp: showTotp ? totp : undefined }, { redirectTo: redirectTarget })
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Error al iniciar sesión'
      setError(Array.isArray(message) ? message.join(', ') : message)
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="mx-auto mt-24 max-w-md rounded border bg-white p-6 text-center text-sm text-gray-600 shadow">
        Validando sesión…
      </div>
    )
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded border bg-white p-6 shadow">
      <h1 className="text-xl font-semibold text-gray-900">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-gray-600">Accede para gestionar reservas, préstamos y el catálogo de libros.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            className="mt-1 block w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            className="mt-1 block w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>

        <div className="space-y-2">
          {showTotp && (
            <label className="block text-sm font-medium text-gray-700">
              Código TOTP
              <input
                value={totp}
                onChange={e => setTotp(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          )}
        </div>

        {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? 'Ingresando…' : 'Entrar'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-xs text-gray-600">
        <span>¿No tienes cuenta?</span>
        <Link href="/register" className="font-medium text-blue-600 underline">Crear una cuenta</Link>
      </div>
    </div>
  )
}
