import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import AuthGuard from '../../components/AuthGuard'
import { useMyReservations } from '../../hooks/useReservations'
import axios from '../../lib/api'
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
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    fulfilled: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
  }
  const labels = {
    pending: 'Pendiente',
    fulfilled: 'Completada',
    cancelled: 'Cancelada',
    expired: 'Expirada',
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

function FeedbackBanner({
  feedback,
  onClose,
}: {
  feedback: { type: 'success' | 'error'; message: string } | null
  onClose: () => void
}) {
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback, onClose])

  if (!feedback) return null

  return (
    <div
      className={`relative rounded-lg border p-4 shadow-sm transition-all duration-300 ${
        feedback.type === 'success'
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span className="text-lg">{feedback.type === 'success' ? '✓' : '✕'}</span>
          <p className="text-sm font-medium">{feedback.message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-gray-600">Cargando reservas...</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-5xl mb-4">📋</div>
      <p className="text-lg font-semibold text-gray-900 mb-2">No tienes reservas activas</p>
      <p className="text-sm text-gray-500 text-center max-w-md mb-6">
        Cuando reserves un libro, aparecerá aquí. Las reservas expiran automáticamente al vencer su fecha límite.
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

export default function MyReservationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useMyReservations()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const cancelReservation = useMutation({
    mutationFn: async (reservationId: string) => {
      await axios.patch(`/reservations/${reservationId}/cancel`)
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Reserva cancelada correctamente' })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (mutationError: any) => {
      const message =
        mutationError?.response?.data?.message ?? mutationError?.message ?? 'No fue posible cancelar la reserva'
      setFeedback({ type: 'error', message })
    },
  })

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
            <p className="mt-2 text-sm text-gray-600">
              Consulta y gestiona tus reservas activas. Las reservas expiran automáticamente al vencer su fecha límite.
            </p>
          </div>

          {/* Feedback Banner */}
          <FeedbackBanner feedback={feedback} onClose={() => setFeedback(null)} />

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-600 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-red-800">Error al cargar reservas</p>
                  <p className="mt-1 text-xs text-red-600">
                    Ocurrió un error al cargar tus reservas. Intenta nuevamente más tarde.
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
              {data?.map((reservation) => (
                <article
                  key={reservation.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {reservation.copy?.book?.title ?? 'Libro'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Copia: {reservation.copy?.code ?? reservation.copy?.id?.slice(0, 8) ?? '—'}
                          </p>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500 mb-1">Fecha de creación</span>
                          <span className="text-sm text-gray-900">
                            {formatDateTime((reservation as any).reservationDate ?? reservation.createdAt)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500 mb-1">Fecha de expiración</span>
                          <span className="text-sm text-gray-900">
                            {formatDateTime((reservation as any).expirationDate ?? reservation.expiresAt)}
                          </span>
                        </div>
                      </div>

                      {reservation.status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => cancelReservation.mutate(reservation.id)}
                            disabled={cancelReservation.isPending}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelReservation.isPending ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                <span>Cancelando...</span>
                              </>
                            ) : (
                              <>
                                <span>✕</span>
                                <span>Cancelar reserva</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
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
