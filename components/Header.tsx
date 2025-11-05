import Link from 'next/link'
import useAuth from '../hooks/useAuth'

export default function Header() {
  const { user, isAuthenticated, logout, hasRole, initializing } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-bold shadow-sm transition-transform group-hover:scale-105">
                B
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                BiblioIcesi
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/books"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                Libros
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/my/reservations"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  >
                    Mis reservas
                  </Link>
                  <Link
                    href="/my/loans"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  >
                    Mis préstamos
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {initializing ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Verificando...</span>
              </div>
            ) : isAuthenticated ? (
              <>
                {hasRole(['ADMIN', 'LIBRARIAN']) && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Panel</span>
                  </Link>
                )}
                <div className="hidden lg:flex lg:items-center lg:gap-3 lg:mr-2">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {user?.role ?? 'Usuario'}
                    </span>
                    <span className="text-xs text-gray-600 truncate max-w-[180px]">{user?.email}</span>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                </div>
                <button
                  type="button"
                  onClick={() => logout({ redirectTo: '/login' })}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <nav className="md:hidden border-t border-gray-200 py-2">
            <div className="flex items-center justify-around gap-1">
              <Link
                href="/books"
                className="flex-1 px-3 py-2 rounded-lg text-center text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Libros
              </Link>
              <Link
                href="/my/reservations"
                className="flex-1 px-3 py-2 rounded-lg text-center text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Reservas
              </Link>
              <Link
                href="/my/loans"
                className="flex-1 px-3 py-2 rounded-lg text-center text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Préstamos
              </Link>
              {hasRole(['ADMIN', 'LIBRARIAN']) && (
                <Link
                  href="/admin"
                  className="flex-1 px-3 py-2 rounded-lg text-center text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  Panel
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
