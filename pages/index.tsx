import Link from 'next/link'
import useAuth from '../hooks/useAuth'

export default function Home() {
  const { isAuthenticated, user, hasRole } = useAuth()

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Bienvenido a BiblioIcesi
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Tu biblioteca digital para explorar, reservar y gestionar libros
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/books"
                className="inline-block bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold text-lg transition hover:bg-blue-50 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Explorar Catálogo
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    href="/login"
                    className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg transition hover:bg-blue-400 hover:shadow-lg transform hover:-translate-y-0.5 border-2 border-blue-400"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/register"
                    className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg transition hover:bg-white/10 hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            ¿Qué puedes hacer?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Explorar Catálogo</h3>
              <p className="text-gray-600">
                Descubre miles de libros disponibles. Busca por título, autor o ISBN y encuentra tu próxima lectura.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Reservar Libros</h3>
              <p className="text-gray-600">
                Reserva los libros que te interesan y recógelos cuando estén disponibles. Gestiona todas tus reservas desde un solo lugar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Gestionar Préstamos</h3>
              <p className="text-gray-600">
                Consulta tus préstamos activos, fechas de devolución y mantén un registro de tus lecturas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      {isAuthenticated && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
              Accesos Rápidos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <Link
                href="/books"
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Catálogo</h3>
                <p className="text-sm text-gray-600">Ver todos los libros</p>
              </Link>

              <Link
                href="/my/reservations"
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Mis Reservas</h3>
                <p className="text-sm text-gray-600">Gestionar reservas</p>
              </Link>

              <Link
                href="/my/loans"
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 group"
              >
                <div className="text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Mis Préstamos</h3>
                <p className="text-sm text-gray-600">Ver préstamos activos</p>
              </Link>

              {hasRole(['ADMIN', 'LIBRARIAN']) && (
                <Link
                  href="/admin"
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 group"
                >
                  <div className="text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Panel Admin</h3>
                  <p className="text-sm text-gray-600">Gestionar sistema</p>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section for non-authenticated users */}
      {!isAuthenticated && (
        <section className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                ¿Listo para comenzar?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Únete a nuestra comunidad y accede a miles de libros a tu disposición
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Crear Cuenta
                </Link>
                <Link
                  href="/login"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg transition hover:bg-gray-50 hover:shadow-lg transform hover:-translate-y-0.5 border-2 border-blue-600"
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
      </div>
        </section>
      )}
    </main>
  )
}
