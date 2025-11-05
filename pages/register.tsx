import { useState } from 'react'
import Link from 'next/link'
import useAuth from '../hooks/useAuth'

export default function RegisterPage(){
  const { register, login } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateField(key: string, value: string){
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent){
    event.preventDefault()
    setError(null)

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      })
      await login({ email: form.email, password: form.password }, { redirectTo: '/books' })
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'No fue posible crear la cuenta.'
      setError(Array.isArray(message) ? message.join(', ') : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-lg rounded border bg-white p-6 shadow">
      <h1 className="text-xl font-semibold text-gray-900">Crear cuenta</h1>
      <p className="mt-1 text-sm text-gray-600">Regístrate para reservar libros y consultar tu historial de préstamos.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Nombre
            <input
              value={form.firstName}
              onChange={event => updateField('firstName', event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Apellido
            <input
              value={form.lastName}
              onChange={event => updateField('lastName', event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>

        <label className="text-sm font-medium text-gray-700">
          Email
          <input
            value={form.email}
            onChange={event => updateField('email', event.target.value)}
            type="email"
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Contraseña
          <input
            value={form.password}
            onChange={event => updateField('password', event.target.value)}
            type="password"
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Confirmar contraseña
          <input
            value={form.confirmPassword}
            onChange={event => updateField('confirmPassword', event.target.value)}
            type="password"
            className="mt-1 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </label>

        {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? 'Registrando…' : 'Crear cuenta'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-xs text-gray-600">
        <span>¿Ya tienes cuenta?</span>
        <Link href="/login" className="font-medium text-blue-600 underline">Inicia sesión</Link>
      </div>
    </div>
  )
}
