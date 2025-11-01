import { useState } from 'react'
import { useRouter } from 'next/router'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
      router.push('/books')
    } catch (err: any) {
      setError(err?.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Iniciar sesión</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 block w-full border rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm">Contraseña</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mt-1 block w-full border rounded p-2" required />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
