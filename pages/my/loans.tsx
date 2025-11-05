import AuthGuard from '../../components/AuthGuard'
import { useMyLoans } from '../../hooks/useLoans'
import Link from 'next/link'

function formatDate(value?: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function getStatusBadge(status: string) {
  const styles = {
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    returned: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
  }
  const labels = {
    active: 'Activo',
    returned: 'Devuelto',
    overdue: 'Vencido',
  }

  const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'
  const label = labels[status as keyof typeof labels] || status

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-gray-600">Cargando préstamos...</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-5xl mb-4">📖</div>
      <p className="text-lg font-semibold text-gray-900 mb-2">No tienes préstamos registrados</p>
      <p className="text-sm text-gray-500 text-center max-w-md mb-6">
        Cuando reserves y recibas libros, aparecerán aquí tus préstamos activos e históricos.
      </p>
      <Link
        href="/books"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Explorar catálogo
      </Link>
    </div>
  )
}

export default function MyLoansPage() {
  const { data, isLoading, error } = useMyLoans()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mis Préstamos</h1>
            <p className="mt-2 text-sm text-gray-600">
              Visualiza tus préstamos activos e históricos, incluyendo fechas y multas si aplican.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-600 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-red-800">Error al cargar préstamos</p>
                  <p className="mt-1 text-xs text-red-600">
                    Ocurrió un error al cargar tus préstamos. Intenta nuevamente más tarde.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <LoadingState />
            </div>
          ) : data && data.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <EmptyState />
            </div>
          ) : (
            <div className="space-y-4">
              {data?.map((loan) => (
                <article
                  key={loan.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {loan.copy?.book?.title ?? 'Libro'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Copia: {loan.copy?.code ?? loan.copy?.id?.slice(0, 8) ?? '—'}
                          </p>
                        </div>
                        {getStatusBadge(loan.status)}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500 mb-1">Entregado</span>
                          <span className="text-sm text-gray-900">
                            {formatDate((loan as any).loanDate ?? loan.borrowedAt)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500 mb-1">Fecha límite</span>
                          <span className="text-sm text-gray-900">{formatDate(loan.dueDate)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500 mb-1">Devuelto</span>
                          <span className="text-sm text-gray-900">
                            {formatDate((loan as any).returnDate ?? loan.returnedAt)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500 mb-1">Multa</span>
                          <span className="text-sm font-medium text-gray-900">
                            {loan.fine
                              ? new Intl.NumberFormat('es-CO', {
                                  style: 'currency',
                                  currency: 'COP',
                                }).format(loan.fine)
                              : 'Sin multa'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
