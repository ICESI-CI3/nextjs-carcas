import { useMutation, useQueryClient } from '@tanstack/react-query'
import AuthGuard from '../../components/AuthGuard'
import { usePendingReservations } from '../../hooks/useReservations'
import { useAllLoans } from '../../hooks/useLoans'
import axios from '../../lib/api'
import { useState } from 'react'

function formatDate(value?: string){
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function AdminDashboard(){
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const pendingReservationsQuery = usePendingReservations(true)
  const loansQuery = useAllLoans(true)

  const fulfillReservation = useMutation({
    mutationFn: async (reservationId: string) => {
      await axios.patch(`/reservations/${reservationId}/fulfill`)
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Reserva marcada como entregada.' })
      queryClient.invalidateQueries({ queryKey: ['reservations', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? 'No fue posible actualizar la reserva.'
      setFeedback({ type: 'error', message })
    },
  })

  const returnLoan = useMutation({
    mutationFn: async (loanId: string) => {
      await axios.patch(`/loans/${loanId}/return`)
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Préstamo marcado como devuelto.' })
      queryClient.invalidateQueries({ queryKey: ['loans', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['my-loans'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? 'No fue posible registrar la devolución.'
      setFeedback({ type: 'error', message })
    },
  })

  const activeLoans = (loansQuery.data ?? []).filter(loan => loan.status === 'active')

  return (
    <AuthGuard roles={['ADMIN', 'LIBRARIAN']}>
      <div className="container mx-auto space-y-8 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel administrativo</h1>
          <p className="text-sm text-gray-600">Gestiona reservas pendientes y préstamos activos desde un solo lugar.</p>
        </div>

        {feedback && (
          <div className={`rounded border p-3 text-sm ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {feedback.message}
          </div>
        )}

        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Reservas pendientes</h2>
            {pendingReservationsQuery.isFetching && <span className="text-xs text-gray-500">Actualizando…</span>}
          </header>

          {pendingReservationsQuery.isLoading ? (
            <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">Cargando reservas…</div>
          ) : pendingReservationsQuery.data && pendingReservationsQuery.data.length > 0 ? (
            <div className="overflow-x-auto rounded border bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Libro</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Usuario</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Creada</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Expira</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingReservationsQuery.data.map(reservation => (
                    <tr key={reservation.id}>
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-800">{reservation.copy?.book?.title ?? 'Libro'}</div>
                        <div className="text-xs text-gray-500">Copia: {reservation.copy?.code ?? reservation.copy?.id ?? '—'}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {reservation.user?.firstName ? `${reservation.user.firstName} ${reservation.user?.lastName ?? ''}`.trim() : reservation.user?.email ?? 'Usuario'}
                        <div className="text-[11px] text-gray-500">{reservation.user?.email}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{formatDate(reservation.createdAt)}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{formatDate(reservation.expiresAt)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => fulfillReservation.mutate(reservation.id)}
                          disabled={fulfillReservation.isPending}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {fulfillReservation.isPending ? 'Procesando…' : 'Marcar entregada'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">No hay reservas pendientes.</div>
          )}
        </section>

        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Préstamos activos</h2>
            {loansQuery.isFetching && <span className="text-xs text-gray-500">Actualizando…</span>}
          </header>

          {loansQuery.isLoading ? (
            <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">Cargando préstamos…</div>
          ) : activeLoans.length > 0 ? (
            <div className="overflow-x-auto rounded border bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Libro</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Usuario</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Entregado</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Fecha límite</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeLoans.map(loan => (
                    <tr key={loan.id}>
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-800">{loan.copy?.book?.title ?? 'Libro'}</div>
                        <div className="text-xs text-gray-500">Copia: {loan.copy?.code ?? loan.copy?.id ?? '—'}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {loan.user?.firstName ? `${loan.user.firstName} ${loan.user?.lastName ?? ''}`.trim() : loan.user?.email ?? 'Usuario'}
                        <div className="text-[11px] text-gray-500">{loan.user?.email}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">{formatDate(loan.borrowedAt)}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{formatDate(loan.dueDate)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => returnLoan.mutate(loan.id)}
                          disabled={returnLoan.isPending}
                          className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {returnLoan.isPending ? 'Procesando…' : 'Registrar devolución'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">No hay préstamos activos.</div>
          )}
        </section>
      </div>
    </AuthGuard>
  )
}
