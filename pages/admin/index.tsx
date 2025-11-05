import { useMutation, useQueryClient } from '@tanstack/react-query'
import AuthGuard from '../../components/AuthGuard'
import { usePendingReservations, useAllReservations } from '../../hooks/useReservations'
import { useAllLoans } from '../../hooks/useLoans'
import axios from '../../lib/api'
import { useState, useEffect, useMemo } from 'react'
import { useUsers } from '../../hooks/useUsers'
import Pagination from '../../components/Pagination'
import useAuth from '../../hooks/useAuth'

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
      <div className="container mx-auto space-y-8 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel administrativo</h1>
          <p className="text-sm text-gray-600">Elige una operación para administrar la plataforma.</p>
        </div>

        {feedback && (
          <div className={`rounded border p-3 text-sm ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {feedback.message}
          </div>
        )}

        {viewMode === 'menu' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isAdmin ? (
              <button onClick={() => setViewMode('users')} className="p-8 rounded border bg-white hover:shadow-lg text-left">
                <div className="text-xl font-semibold mb-2">Gestión de usuarios</div>
                <div className="text-sm text-gray-600">Lista de usuarios, búsqueda y cambio de rol.</div>
              </button>
            ) : null}
            <button onClick={() => setViewMode('loans')} className="p-8 rounded border bg-white hover:shadow-lg text-left">
              <div className="text-xl font-semibold mb-2">Préstamos y Reservas</div>
              <div className="text-sm text-gray-600">Panel de reservas pendientes y préstamos; ver historial completo.</div>
            </button>
          </div>
        ) : null}
        {viewMode === 'loans' && (
          <div className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-lg font-semibold">Reservas pendientes</h2>
              <div>
                <button className="text-sm text-blue-600 hover:underline mr-4" onClick={() => setViewMode('menu')}>← Volver</button>
                {pendingReservationsQuery.isFetching && <span className="text-xs text-gray-500">Actualizando…</span>}
              </div>
            </div>

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
          {pendingReservationsQuery.data.map((reservation: any) => (
            <tr key={reservation.id}>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-800">{reservation.copy?.book?.title ?? 'Libro'}</div>
                          <div className="text-xs text-gray-500">Copia: {reservation.copy?.code ?? reservation.copy?.id ?? '—'}</div>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-600">
                          {reservation.user?.firstName ? `${reservation.user.firstName} ${reservation.user?.lastName ?? ''}`.trim() : reservation.user?.email ?? 'Usuario'}
                          <div className="text-[11px] text-gray-500">{reservation.user?.email}</div>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-600">{formatDate((reservation as any).reservationDate ?? reservation.createdAt)}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{formatDate((reservation as any).expirationDate ?? reservation.expiresAt)}</td>
                        <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fulfillReservation.mutate(reservation.id) }}
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

            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Préstamos activos</h2>
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
                      {activeLoans.map((loan: any) => (
                        <tr key={loan.id}>
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-800">{loan.copy?.book?.title ?? 'Libro'}</div>
                            <div className="text-xs text-gray-500">Copia: {loan.copy?.code ?? loan.copy?.id ?? '—'}</div>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {loan.user?.firstName ? `${loan.user.firstName} ${loan.user?.lastName ?? ''}`.trim() : loan.user?.email ?? 'Usuario'}
                            <div className="text-[11px] text-gray-500">{loan.user?.email}</div>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">{formatDate((loan as any).loanDate ?? loan.borrowedAt)}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">{formatDate(loan.dueDate)}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); returnLoan.mutate(loan.id) }}
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

            
            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Historial - Todas las reservas</h2>
                {allReservationsQuery.isFetching && <span className="text-xs text-gray-500">Actualizando…</span>}
              </header>
              {allReservationsQuery.isLoading ? (
                <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">Cargando historial de reservas…</div>
              ) : allReservationsQuery.data && allReservationsQuery.data.length > 0 ? (
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <label className="text-sm">Filtrar por estado:</label>
                    <select value={reservationFilter} onChange={e => setReservationFilter(e.target.value)} className="rounded border px-2 py-1 text-sm">
                      {reservationStatuses.map((s: any) => (
                        <option key={String(s)} value={String(s)}>{s === 'all' ? 'Todos' : String(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto rounded border bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Libro</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Copia</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Usuario</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Rol</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Estado</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Creada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(allReservationsQuery.data || [])
                          .filter((r: any) => reservationFilter === 'all' ? true : r.status === reservationFilter)
                          .map((r: any) => (
                              <tr key={r.id}>
                              <td className="px-4 py-2">{r.copy?.book?.title ?? 'Libro'}</td>
                              <td className="px-4 py-2 text-xs">{r.copy?.code ?? r.copy?.id ?? '—'}</td>
                              <td className="px-4 py-2 text-xs text-gray-600">{r.user?.email ?? 'Usuario'}</td>
                              <td className="px-4 py-2 text-xs">{r.user?.role ?? '—'}</td>
                              <td className="px-4 py-2 text-xs">{r.status}</td>
                              <td className="px-4 py-2 text-xs">{formatDate(r.createdAt)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">No hay reservas registradas.</div>
              )}
            </section>

            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Historial - Todos los préstamos</h2>
                {loansQuery.isFetching && <span className="text-xs text-gray-500">Actualizando…</span>}
              </header>
              {loansQuery.isLoading ? (
                <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">Cargando historial de préstamos…</div>
              ) : loansQuery.data && loansQuery.data.length > 0 ? (
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <label className="text-sm">Filtrar por estado:</label>
                    <select value={loanFilter} onChange={e => setLoanFilter(e.target.value)} className="rounded border px-2 py-1 text-sm">
                      {loanStatuses.map((s: any) => (
                        <option key={String(s)} value={String(s)}>{s === 'all' ? 'Todos' : String(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto rounded border bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Libro</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Copia</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Usuario</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Rol</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Estado</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Prestado</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Devuelto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(loansQuery.data || [])
                          .filter((l: any) => loanFilter === 'all' ? true : l.status === loanFilter)
                          .map((l: any) => (
                            <tr key={l.id}>
                              <td className="px-4 py-2">{l.copy?.book?.title ?? 'Libro'}</td>
                              <td className="px-4 py-2 text-xs">{l.copy?.code ?? l.copy?.id ?? '—'}</td>
                              <td className="px-4 py-2 text-xs text-gray-600">{l.user?.email ?? 'Usuario'}</td>
                              <td className="px-4 py-2 text-xs">{l.user?.role ?? '—'}</td>
                              <td className="px-4 py-2 text-xs">{l.status}</td>
                              <td className="px-4 py-2 text-xs">{formatDate((l as any).loanDate ?? l.borrowedAt)}</td>
                              <td className="px-4 py-2 text-xs">{formatDate((l as any).returnDate ?? l.returnedAt)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">No hay préstamos registrados.</div>
              )}
            </section>
          </div>
        )}

        {viewMode === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gestión de usuarios</h2>
              <div>
                <button className="text-sm text-blue-600 hover:underline mr-4" onClick={() => setViewMode('menu')}>← Volver</button>
              </div>
            </div>

            <div className="rounded border bg-white p-4">

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Correo</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Teléfono</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Nombre</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(usersQuery.data?.items ?? []).map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedUser(u); setNewRole(u.role ?? 'student') }}>
                        <td className="px-4 py-2">{u.email}</td>
                        <td className="px-4 py-2 text-xs">{u.phone ?? '—'}</td>
                        <td className="px-4 py-2 text-xs">{u.firstName ? `${u.firstName} ${u.lastName ?? ''}` : '—'}</td>
                        <td className="px-4 py-2 text-xs">{u.role ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-600">{usersQuery.data ? `${usersQuery.data.meta.total} usuarios` : 'Cargando…'}</div>
                <Pagination currentPage={userPage} totalItems={usersQuery.data?.meta.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setUserPage} />
              </div>
            </div>

            
            
            {!selectedUser ? null : (
              <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-2">Cambiar rol de usuario</h3>
                  <div className="text-sm text-gray-600 mb-3">{selectedUser.email}</div>
                  <label className="block text-sm mb-3">Nuevo rol
                    <select value={newRole} onChange={e => setNewRole(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm">
                      <option value="student">Student</option>
                      <option value="librarian">Librarian</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <div className="flex gap-2 justify-end">
                    <button className="rounded bg-gray-200 px-3 py-1" onClick={() => setSelectedUser(null)}>Cancelar</button>
                    <button
                      className="rounded bg-blue-600 px-3 py-1 text-white"
                      onClick={async () => {
                        if(!selectedUser) return
                        await changeUserRole(selectedUser.id, newRole)
                        setSelectedUser(null)
                      }}
                      disabled={changingRole}
                    >{changingRole ? 'Procesando…' : 'Confirmar'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      
      </div>
    </AuthGuard>
  )
}
