import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AuthGuard from '../../components/AuthGuard'
import axios from '../../lib/api'
import { useState, useEffect } from 'react'
import { useBooks } from '../../hooks/useBooks'
import Pagination from '../../components/Pagination'
import Link from 'next/link'

const PAGE_SIZE = 10

// ===== Utility Functions =====
function getCopyStatusColor(status: string): string {
  switch (status) {
    case 'available':
      return 'bg-green-50 border-green-200 text-green-800'
    case 'borrowed':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'reserved':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    case 'maintenance':
      return 'bg-orange-50 border-orange-200 text-orange-800'
    case 'lost':
      return 'bg-red-50 border-red-200 text-red-800'
    case 'deleted':
      return 'bg-gray-50 border-gray-200 text-gray-500'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800'
  }
}

function getCopyStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponible',
    borrowed: 'Prestado',
    reserved: 'Reservado',
    maintenance: 'En mantenimiento',
    lost: 'Perdido',
    deleted: 'Eliminado',
  }
  return labels[status] || status
}

// ===== Types =====
type Copy = {
  id: string
  code?: string
  status: string
  location?: string
}

type BookWithCopies = {
  id: string
  title: string
  author?: string
  isbn?: string
  copies?: Copy[]
}

// ===== Components =====
function FeedbackBanner({ 
  feedback, 
  onClose 
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
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-gray-600">Cargando libros...</p>
    </div>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-4xl mb-4">📚</div>
      <p className="text-base font-medium text-gray-900 mb-2">
        {search ? 'No se encontraron resultados' : 'No hay libros registrados'}
      </p>
      <p className="text-sm text-gray-500 text-center max-w-md">
        {search
          ? 'Intenta ajustar tus términos de búsqueda'
          : 'Comienza agregando tu primer libro al sistema'}
      </p>
    </div>
  )
}

function AddCopyModal({
  book,
  existingCount,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  book: { id: string; title: string; isbn?: string }
  existingCount: number
  onClose: () => void
  onSubmit: (code: string, location: string) => void
  isSubmitting: boolean
}) {
  const [code, setCode] = useState('')
  const [location, setLocation] = useState('')

  const generateCopyCode = (bookIsbn: string | undefined, count: number): string => {
    if (bookIsbn) {
      const cleanIsbn = bookIsbn.replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase()
      return `${cleanIsbn}-${String(count + 1).padStart(3, '0')}`
    }
    return `COP-${String(count + 1).padStart(4, '0')}`
  }

  const autoCode = generateCopyCode(book.isbn, existingCount)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(code.trim() || autoCode, location.trim())
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Agregar nueva copia</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">{book.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Código <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={autoCode}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {!code && (
              <p className="mt-1.5 text-xs text-gray-500">
                Código automático: <span className="font-mono font-semibold text-gray-700">{autoCode}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ubicación <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Estante A-3, Sección B"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creando...
                </span>
              ) : (
                'Crear copia'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting,
}: {
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
              <p className="mt-1 text-sm text-gray-600">
                Esta acción marcará la copia como eliminada. No se puede deshacer.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Eliminando...
                </span>
              ) : (
                'Eliminar copia'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Main Component =====
export default function AdminBooksPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showAddCopyModal, setShowAddCopyModal] = useState<{
    bookId: string
    bookTitle: string
    bookIsbn?: string
    existingCopiesCount: number
  } | null>(null)
  const [deleteCopyId, setDeleteCopyId] = useState<string | null>(null)

  const booksQuery = useBooks({ search, page, pageSize: PAGE_SIZE })

  const expandedBookQuery = useQuery<BookWithCopies>({
    queryKey: ['book', expandedBookId],
    queryFn: async () => {
      const { data } = await axios.get(`/books/${expandedBookId}`)
      return data
    },
    enabled: !!expandedBookId,
  })

  const createCopyMutation = useMutation({
    mutationFn: async ({ bookId, code, location }: { bookId: string; code: string; location?: string }) => {
      try {
        await axios.post(`/books/${bookId}/copies`, { code, location, status: 'available' })
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          await axios.post('/copies', { bookId, code, location, status: 'available' })
        } else {
          throw err
        }
      }
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Copia creada exitosamente' })
      setShowAddCopyModal(null)
      queryClient.invalidateQueries({ queryKey: ['book', expandedBookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message ?? 'No fue posible crear la copia',
      })
    },
  })

  const updateCopyStatusMutation = useMutation({
    mutationFn: async ({ copyId, status }: { copyId: string; status: string }) => {
      await axios.patch(`/copies/${copyId}`, { status })
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Estado actualizado correctamente' })
      queryClient.invalidateQueries({ queryKey: ['book', expandedBookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message ?? 'No fue posible actualizar el estado',
      })
    },
  })

  const deleteCopyMutation = useMutation({
    mutationFn: async (copyId: string) => {
      try {
        await axios.patch(`/copies/${copyId}`, { status: 'deleted' })
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          await axios.delete(`/copies/${copyId}`)
        } else {
          throw err
        }
      }
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Copia eliminada exitosamente' })
      setDeleteCopyId(null)
      queryClient.invalidateQueries({ queryKey: ['book', expandedBookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error?.response?.data?.message ?? 'No fue posible eliminar la copia',
      })
    },
  })

  const handleAddCopy = (code: string, location: string) => {
    if (!showAddCopyModal) return
    createCopyMutation.mutate({
      bookId: showAddCopyModal.bookId,
      code,
      location: location || undefined,
    })
  }

  const books = booksQuery.data?.items ?? []
  const totalBooks = booksQuery.data?.meta.total ?? 0

  return (
    <AuthGuard roles={['ADMIN', 'LIBRARIAN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Libros y Copias</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Administra el inventario completo de libros y gestiona todas sus copias
                </p>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>←</span>
                <span>Volver al panel</span>
              </Link>
            </div>
          </div>

          {/* Feedback Banner */}
          <FeedbackBanner feedback={feedback} onClose={() => setFeedback(null)} />

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">🔍</span>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                placeholder="Buscar por título, autor o ISBN..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              {booksQuery.isFetching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Books Table */}
          {booksQuery.isLoading ? (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <LoadingState />
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <EmptyState search={search} />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Autor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ISBN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Copias
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Disponibles
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {books.map((book: any) => {
                      const allCopies = book.copies || []
                      const copies = allCopies.filter((c: any) => c.status !== 'deleted')
                      const availableCount = copies.filter((c: any) => c.status === 'available').length
                      const isExpanded = expandedBookId === book.id
                      const expandedBook = isExpanded ? expandedBookQuery.data : null
                      const allExpandedCopies = expandedBook?.copies || []
                      const displayCopies = allExpandedCopies.filter((c: any) => c.status !== 'deleted')

                      return (
                        <>
                          <tr
                            key={book.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{book.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{book.author || '—'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-mono text-xs text-gray-500">{book.isbn || '—'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {copies.length}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  availableCount > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {availableCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedBookId(isExpanded ? null : book.id)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
                              >
                                <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                                <span>{isExpanded ? 'Ocultar' : 'Ver'} copias</span>
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-gray-50">
                              <td colSpan={6} className="p-0">
                                <div className="px-6 py-6">
                                  {expandedBookQuery.isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                                      <span className="text-sm text-gray-600">Cargando copias...</span>
                                    </div>
                                  ) : displayCopies.length > 0 ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h3 className="text-base font-semibold text-gray-900">
                                            Copias del libro
                                          </h3>
                                          <p className="mt-1 text-sm text-gray-500">
                                            {displayCopies.length} copia{displayCopies.length !== 1 ? 's' : ''} registrada{displayCopies.length !== 1 ? 's' : ''}
                                          </p>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setShowAddCopyModal({
                                              bookId: book.id,
                                              bookTitle: book.title,
                                              bookIsbn: book.isbn,
                                              existingCopiesCount: displayCopies.length,
                                            })
                                          }}
                                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                                        >
                                          <span>+</span>
                                          <span>Agregar copia</span>
                                        </button>
                                      </div>

                                      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                Código
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                Estado
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                Ubicación
                                              </th>
                                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                                                Acciones
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {displayCopies.map((copy: Copy) => (
                                              <tr key={copy.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                  <div className="font-mono text-sm font-medium text-gray-900">
                                                    {copy.code || `Copia ${copy.id.slice(0, 8)}`}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                  <select
                                                    value={copy.status}
                                                    onChange={(e) => {
                                                      if (e.target.value !== copy.status) {
                                                        updateCopyStatusMutation.mutate({
                                                          copyId: copy.id,
                                                          status: e.target.value,
                                                        })
                                                      }
                                                    }}
                                                    disabled={updateCopyStatusMutation.isPending}
                                                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${getCopyStatusColor(copy.status)}`}
                                                  >
                                                    <option value="available">Disponible</option>
                                                    <option value="borrowed">Prestado</option>
                                                    <option value="reserved">Reservado</option>
                                                    <option value="maintenance">En mantenimiento</option>
                                                    <option value="lost">Perdido</option>
                                                    <option value="deleted">Eliminado</option>
                                                  </select>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                  <div className="text-sm text-gray-600">{copy.location || '—'}</div>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-center">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      setDeleteCopyId(copy.id)
                                                    }}
                                                    disabled={deleteCopyMutation.isPending}
                                                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                  >
                                                    Eliminar
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <div className="text-4xl mb-3">📖</div>
                                    <p className="text-sm font-medium text-gray-900 mb-2">No hay copias registradas</p>
                                    <p className="text-xs text-gray-500 mb-4">
                                      Comienza agregando la primera copia de este libro
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowAddCopyModal({
                                          bookId: book.id,
                                          bookTitle: book.title,
                                          bookIsbn: book.isbn,
                                          existingCopiesCount: 0,
                                        })
                                      }}
                                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                                    >
                                      <span>+</span>
                                      <span>Agregar primera copia</span>
                                    </button>
                                  </div>
                                )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {books.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-medium text-gray-900">{books.length}</span> de{' '}
                <span className="font-medium text-gray-900">{totalBooks}</span> libro
                {totalBooks !== 1 ? 's' : ''}
              </div>
              <Pagination
                currentPage={page}
                totalItems={totalBooks}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}

          {/* Modals */}
          {showAddCopyModal && (
            <AddCopyModal
              book={{
                id: showAddCopyModal.bookId,
                title: showAddCopyModal.bookTitle,
                isbn: showAddCopyModal.bookIsbn,
              }}
              existingCount={showAddCopyModal.existingCopiesCount}
              onClose={() => setShowAddCopyModal(null)}
              onSubmit={handleAddCopy}
              isSubmitting={createCopyMutation.isPending}
            />
          )}

          {deleteCopyId && (
            <DeleteConfirmModal
              onConfirm={() => {
                if (deleteCopyId) {
                  deleteCopyMutation.mutate(deleteCopyId)
                }
              }}
              onCancel={() => setDeleteCopyId(null)}
              isDeleting={deleteCopyMutation.isPending}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
