import AuthGuard from '../../components/AuthGuard'
import { useMyLoans } from '../../hooks/useLoans'

function formatDate(value?: string){
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function MyLoansPage(){
  const { data, isLoading, error } = useMyLoans()

  return (
    <AuthGuard>
      <div className="container mx-auto space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis préstamos</h1>
          <p className="text-sm text-gray-600">Visualiza tus préstamos activos e históricos, incluidos los valores de multa si aplica.</p>
        </div>

        {isLoading && (
          <div className="rounded border bg-white p-8 text-center text-sm text-gray-600 shadow">Cargando préstamos…</div>
        )}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Ocurrió un error al cargar tus préstamos.
          </div>
        )}

        {data && data.length === 0 && (
          <div className="rounded border bg-white p-8 text-center text-sm text-gray-600 shadow">
            No tienes préstamos registrados por ahora.
          </div>
        )}

        {data && data.length > 0 && (
          <div className="grid gap-4">
            {data.map(loan => (
              <article key={loan.id} className="rounded border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{loan.copy?.book?.title ?? 'Libro'}</div>
                    <div className="text-xs text-gray-500">Copia: {loan.copy?.code ?? loan.copy?.id ?? '—'}</div>
                  </div>
                  <span className={`inline-flex h-6 items-center rounded-full px-3 text-xs font-medium ${loan.status === 'active' ? 'bg-blue-100 text-blue-700' : loan.status === 'returned' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {loan.status}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="font-medium">Entregado</dt>
                    <dd>{formatDate(loan.borrowedAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Fecha límite</dt>
                    <dd>{formatDate(loan.dueDate)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Devuelto</dt>
                    <dd>{formatDate(loan.returnedAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Multa</dt>
                    <dd>{loan.fine ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(loan.fine) : '—'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
