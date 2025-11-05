import { useMutation, useQueryClient } from '@tanstack/react-query'
import AuthGuard from '../../components/AuthGuard'
import { usePendingReservations, useAllReservations } from '../../hooks/useReservations'
import { useAllLoans } from '../../hooks/useLoans'
import axios from '../../lib/api'
import { useState, useEffect, useMemo } from 'react'
import { useUsers } from '../../hooks/useUsers'
import Pagination from '../../components/Pagination'
import useAuth from '../../hooks/useAuth'
import { useRouter } from 'next/router'

function formatDate(value?: string){
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function AdminDashboard(){
  const router = useRouter()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [viewMode, setViewMode] = useState<'menu' | 'loans' | 'users'>('menu')

  const pendingReservationsQuery = usePendingReservations(true)
  const loansQuery = useAllLoans(true)
  const allReservationsQuery = useAllReservations(viewMode === 'loans')

  const { hasRole } = useAuth()
  const isAdmin = hasRole(['ADMIN'])

  
  const [userPage, setUserPage] = useState(1)
  const PAGE_SIZE = 10
  const usersQuery = useUsers({ page: userPage, pageSize: PAGE_SIZE })
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [changingRole, setChangingRole] = useState(false)
  const [newRole, setNewRole] = useState<string>('student')
  

  const fulfillReservation = useMutation<any, any, any>({
    mutationFn: async (reservationId: any) => {
      await axios.patch(`/reservations/${reservationId}/fulfill`)

      const resp = await axios.get(`/reservations/${reservationId}`)
      const reservation = resp.data
      const userId = reservation?.user?.id
      const copyId = reservation?.copy?.id

      if (!userId || !copyId) {
        return { loanCreated: false, error: 'Datos de reserva incompletos' }
      }

      const maxAttempts = 6
      let attempt = 0
      let lastErr: any = null
      while (attempt < maxAttempts) {
        try {
          await axios.post('/loans/for-user', { userId, copyId })
          return { loanCreated: true }
        } catch (err: any) {
          lastErr = err
          attempt++
          const backoff = 800 * attempt
          await new Promise(r => setTimeout(r, backoff))
        }
      }

      return { loanCreated: false, error: lastErr?.response?.data?.message ?? lastErr?.message }
    },
    onMutate: () => setFeedback(null),
    onSuccess: (data: any) => {
      if (data?.loanCreated) {
        setFeedback({ type: 'success', message: 'Reserva marcada como entregada y préstamo creado.' })
      } else {
        setFeedback({ type: 'error', message: `Reserva marcada como entregada, pero no fue posible crear el préstamo: ${data?.error ?? 'error desconocido'}` })
      }
      queryClient.invalidateQueries({ queryKey: ['reservations', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['loans', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['my-loans'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? 'No fue posible actualizar la reserva.'
      setFeedback({ type: 'error', message })
    }
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

  
  async function changeUserRole(userId: string, role: string){
    setChangingRole(true)
    setFeedback(null)
    try {
      await axios.patch(`/users/${userId}`, { role })
      setFeedback({ type: 'success', message: 'Rol actualizado.' })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.response?.data?.message ?? String(err) })
    } finally {
      setChangingRole(false)
    }
  }

  // user search removed; keep pagination behavior

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(t)
  }, [feedback])

  
  const reservationStatuses = useMemo(() => {
    const s = new Set()
    ;(allReservationsQuery.data || []).forEach((r: any) => r.status && s.add(r.status))
    return ['all', ...Array.from(s)]
  }, [allReservationsQuery.data])

  const loanStatuses = useMemo(() => {
    const s = new Set()
    ;(loansQuery.data || []).forEach((l: any) => l.status && s.add(l.status))
    return ['all', ...Array.from(s)]
  }, [loansQuery.data])

  const [reservationFilter, setReservationFilter] = useState<string>('all')
  const [loanFilter, setLoanFilter] = useState<string>('all')

  return (
    <AuthGuard roles={['ADMIN', 'LIBRARIAN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
            <p className="mt-2 text-sm text-gray-600">
              Gestiona la plataforma: libros, copias, préstamos, reservas y usuarios.
            </p>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`mb-6 rounded-lg border p-4 shadow-sm ${
                feedback.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{feedback.type === 'success' ? '✓' : '✕'}</span>
                <p className="text-sm font-medium flex-1">{feedback.message}</p>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Menu */}
          {viewMode === 'menu' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => router.push('/admin/books')}
                className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl group-hover:bg-blue-200 transition-colors">
                    📚
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Gestión de Libros y Copias</h3>
                    <p className="text-sm text-gray-600">
                      Ver todos los libros en tabla, gestionar copias: agregar, eliminar y cambiar estado.
                    </p>
                  </div>
                </div>
              </button>
              {isAdmin && (
                <button
                  onClick={() => setViewMode('users')}
                  className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-2xl group-hover:bg-green-200 transition-colors">
                      👥
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Gestión de Usuarios</h3>
                      <p className="text-sm text-gray-600">Lista de usuarios, búsqueda y cambio de rol.</p>
                    </div>
                  </div>
                </button>
              )}
              <button
                onClick={() => setViewMode('loans')}
                className="group p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-2xl group-hover:bg-purple-200 transition-colors">
                    📋
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Préstamos y Reservas</h3>
                    <p className="text-sm text-gray-600">
                      Panel de reservas pendientes y préstamos activos. Ver historial completo.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}
          {/* Loans & Reservations View */}
          {viewMode === 'loans' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Préstamos y Reservas</h2>
                  <p className="mt-1 text-sm text-gray-600">Gestiona reservas pendientes y préstamos activos</p>
                </div>
                <button
                  onClick={() => setViewMode('menu')}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>←</span>
                  <span>Volver</span>
                </button>
              </div>

              {/* Pending Reservations */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Reservas Pendientes</h3>
                  {pendingReservationsQuery.isFetching && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>Actualizando...</span>
                    </div>
                  )}
                </div>

                {pendingReservationsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Cargando reservas...</span>
                    </div>
                  </div>
                ) : pendingReservationsQuery.data && pendingReservationsQuery.data.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Libro
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Creada
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Expira
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingReservationsQuery.data.map((reservation: any) => (
                          <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{reservation.copy?.book?.title ?? 'Libro'}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Copia: {reservation.copy?.code ?? reservation.copy?.id?.slice(0, 8) ?? '—'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {reservation.user?.firstName
                                  ? `${reservation.user.firstName} ${reservation.user?.lastName ?? ''}`.trim()
                                  : reservation.user?.email ?? 'Usuario'}
                              </div>
                              <div className="text-xs text-gray-500">{reservation.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate((reservation as any).reservationDate ?? reservation.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate((reservation as any).expirationDate ?? reservation.expiresAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  fulfillReservation.mutate(reservation.id)
                                }}
                                disabled={fulfillReservation.isPending}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {fulfillReservation.isPending ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Procesando...</span>
                                  </>
                                ) : (
                                  'Marcar entregada'
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-sm font-medium text-gray-900">No hay reservas pendientes</p>
                    <p className="text-xs text-gray-500 mt-1">Todas las reservas han sido procesadas</p>
                  </div>
                )}
              </section>

              {/* Active Loans */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Préstamos Activos</h3>
                  {loansQuery.isFetching && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>Actualizando...</span>
                    </div>
                  )}
                </div>

                {loansQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Cargando préstamos...</span>
                    </div>
                  </div>
                ) : activeLoans.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Libro
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Entregado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Fecha límite
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeLoans.map((loan: any) => (
                          <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{loan.copy?.book?.title ?? 'Libro'}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Copia: {loan.copy?.code ?? loan.copy?.id?.slice(0, 8) ?? '—'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {loan.user?.firstName
                                  ? `${loan.user.firstName} ${loan.user?.lastName ?? ''}`.trim()
                                  : loan.user?.email ?? 'Usuario'}
                              </div>
                              <div className="text-xs text-gray-500">{loan.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate((loan as any).loanDate ?? loan.borrowedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(loan.dueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  returnLoan.mutate(loan.id)
                                }}
                                disabled={returnLoan.isPending}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {returnLoan.isPending ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Procesando...</span>
                                  </>
                                ) : (
                                  'Registrar devolución'
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                    <div className="text-4xl mb-3">📚</div>
                    <p className="text-sm font-medium text-gray-900">No hay préstamos activos</p>
                    <p className="text-xs text-gray-500 mt-1">Todos los préstamos han sido devueltos</p>
                  </div>
                )}
              </section>

              {/* All Reservations History */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Historial - Todas las Reservas</h3>
                  {allReservationsQuery.isFetching && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>Actualizando...</span>
                    </div>
                  )}
                </div>
                {allReservationsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Cargando historial...</span>
                    </div>
                  </div>
                ) : allReservationsQuery.data && allReservationsQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
                      <select
                        value={reservationFilter}
                        onChange={(e) => setReservationFilter(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                      >
                        {reservationStatuses.map((s: any) => (
                          <option key={String(s)} value={String(s)}>
                            {s === 'all' ? 'Todos' : String(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Libro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Copia
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Creada
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(allReservationsQuery.data || [])
                            .filter((r: any) => (reservationFilter === 'all' ? true : r.status === reservationFilter))
                            .map((r: any) => (
                              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {r.copy?.book?.title ?? 'Libro'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-600">
                                  {r.copy?.code ?? r.copy?.id?.slice(0, 8) ?? '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                  {r.user?.email ?? 'Usuario'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                  {r.user?.role ?? '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                                    {r.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                  {formatDate(r.createdAt)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-sm font-medium text-gray-900">No hay reservas registradas</p>
                    <p className="text-xs text-gray-500 mt-1">El historial aparecerá cuando se registren reservas</p>
                  </div>
                )}
              </section>

              {/* All Loans History */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Historial - Todos los Préstamos</h3>
                  {loansQuery.isFetching && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>Actualizando...</span>
                    </div>
                  )}
                </div>
                {loansQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Cargando historial...</span>
                    </div>
                  </div>
                ) : loansQuery.data && loansQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
                      <select
                        value={loanFilter}
                        onChange={(e) => setLoanFilter(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                      >
                        {loanStatuses.map((s: any) => (
                          <option key={String(s)} value={String(s)}>
                            {s === 'all' ? 'Todos' : String(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Libro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Copia
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Prestado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Devuelto
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(loansQuery.data || [])
                            .filter((l: any) => (loanFilter === 'all' ? true : l.status === loanFilter))
                            .map((l: any) => (
                              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {l.copy?.book?.title ?? 'Libro'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-600">
                                  {l.copy?.code ?? l.copy?.id?.slice(0, 8) ?? '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                  {l.user?.email ?? 'Usuario'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                  {l.user?.role ?? '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                                    {l.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                  {formatDate((l as any).loanDate ?? l.borrowedAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                  {formatDate((l as any).returnDate ?? l.returnedAt)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                    <div className="text-4xl mb-3">📖</div>
                    <p className="text-sm font-medium text-gray-900">No hay préstamos registrados</p>
                    <p className="text-xs text-gray-500 mt-1">El historial aparecerá cuando se registren préstamos</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Users Management View */}
          {viewMode === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
                  <p className="mt-1 text-sm text-gray-600">Administra usuarios y sus roles en el sistema</p>
                </div>
                <button
                  onClick={() => setViewMode('menu')}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>←</span>
                  <span>Volver</span>
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Correo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Teléfono
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Rol
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(usersQuery.data?.items ?? []).map((u: any) => (
                        <tr
                          key={u.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedUser(u)
                            setNewRole(u.role ?? 'student')
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.phone ?? '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                              {u.role ?? '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-gray-600">
                    {usersQuery.data ? (
                      <>
                        <span className="font-medium text-gray-900">{usersQuery.data.meta.total}</span> usuario
                        {usersQuery.data.meta.total !== 1 ? 's' : ''}
                      </>
                    ) : (
                      'Cargando...'
                    )}
                  </div>
                  <Pagination
                    currentPage={userPage}
                    totalItems={usersQuery.data?.meta.total ?? 0}
                    pageSize={PAGE_SIZE}
                    onPageChange={setUserPage}
                  />
                </div>
              </div>

            
              {/* Change Role Modal */}
              {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div
                    className="w-full max-w-md rounded-xl bg-white shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Cambiar rol de usuario</h3>
                      <p className="mt-1 text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nuevo rol</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                        >
                          <option value="student">Student</option>
                          <option value="librarian">Librarian</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedUser(null)}
                        >
                          Cancelar
                        </button>
                        <button
                          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={async () => {
                            if (!selectedUser) return
                            await changeUserRole(selectedUser.id, newRole)
                            setSelectedUser(null)
                          }}
                          disabled={changingRole}
                        >
                          {changingRole ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              <span>Procesando...</span>
                            </span>
                          ) : (
                            'Confirmar'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
