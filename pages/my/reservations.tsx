import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import { useMyReservations } from '../../hooks/useReservations'
import axios from '../../lib/api'

function formatDate(value?: string){
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function MyReservationsPage(){
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useMyReservations()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const cancelReservation = useMutation({
    mutationFn: async (reservationId: string) => {
      await axios.patch(`/reservations/${reservationId}/cancel`)
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Reserva cancelada correctamente.' })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (mutationError: any) => {
      const message = mutationError?.response?.data?.message ?? mutationError?.message ?? 'No fue posible cancelar la reserva.'
      setFeedback({ type: 'error', message })
    },
  })

  return (
    <AuthGuard>
      <div className="container mx-auto space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis reservas</h1>
          <p className="text-sm text-gray-600">Consulta y gestiona tus reservas activas. Las reservas expiran automáticamente al vencer su fecha límite.</p>
        </div>

        {isLoading && (
          <div className="rounded border bg-white p-8 text-center text-sm text-gray-600 shadow">Cargando reservas…</div>
        )}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Ocurrió un error al cargar tus reservas.
          </div>
        )}

        {feedback && (
          <div className={`rounded border p-3 text-sm ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {feedback.message}
          </div>
        )}

        {data && data.length === 0 && (
          <div className="rounded border bg-white p-8 text-center text-sm text-gray-600 shadow">
            No tienes reservas activas por el momento.
          </div>
        )}

        {data && data.length > 0 && (
          <div className="grid gap-4">
            {data.map(reservation => (
              <article key={reservation.id} className="rounded border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{reservation.copy?.book?.title ?? 'Libro'}</div>
                    <div className="text-xs text-gray-500">Copia: {reservation.copy?.code ?? reservation.copy?.id ?? '—'}</div>
                  </div>
                  <span className={`inline-flex h-6 items-center rounded-full px-3 text-xs font-medium ${reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : reservation.status === 'fulfilled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {reservation.status}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 md:grid-cols-2">
                  <div>
                    <dt className="font-medium">Creada</dt>
                    <dd>{formatDate(reservation.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Expira</dt>
                    <dd>{formatDate(reservation.expiresAt)}</dd>
                  </div>
                </dl>

                {reservation.status === 'pending' && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => cancelReservation.mutate(reservation.id)}
                      disabled={cancelReservation.isPending}
                      className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {cancelReservation.isPending ? 'Cancelando…' : 'Cancelar reserva'}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
