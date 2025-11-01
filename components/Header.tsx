import Link from 'next/link'
import useAuth from '../hooks/useAuth'

export default function Header(){
  const { user, isAuthenticated, logout, hasRole, initializing } = useAuth()

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 p-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-blue-700">
          BiblioIcesi
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <Link href="/books" className="transition hover:text-blue-600">Libros</Link>
          {isAuthenticated && (
            <>
              <Link href="/my/reservations" className="transition hover:text-blue-600">Mis reservas</Link>
              <Link href="/my/loans" className="transition hover:text-blue-600">Mis préstamos</Link>
            </>
          )}
          {initializing ? (
            <div className="text-xs text-gray-500">Verificando sesión…</div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              {hasRole(['ADMIN', 'LIBRARIAN']) && (
                <Link
                  href="/admin"
                  className="rounded border border-blue-100 px-3 py-1 text-blue-700 transition hover:bg-blue-50"
                >
                  Panel
                </Link>
              )}
              <div className="hidden sm:flex sm:flex-col sm:items-end">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {user?.role ?? 'Usuario'}
                </span>
                <span className="text-xs text-gray-600">{user?.email}</span>
              </div>
              <button
                type="button"
                onClick={() => logout({ redirectTo: '/login' })}
                className="rounded bg-red-500 px-3 py-1 text-white transition hover:bg-red-600"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="rounded px-3 py-1 transition hover:bg-gray-100">Iniciar sesión</Link>
              <Link href="/register" className="rounded border border-blue-200 px-3 py-1 text-blue-600 transition hover:bg-blue-50">Registrarme</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
