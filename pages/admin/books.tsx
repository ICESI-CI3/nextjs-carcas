import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AuthGuard from '../../components/AuthGuard'
import axios from '../../lib/api'
import { useState, useMemo } from 'react'
import { useBooks } from '../../hooks/useBooks'
import Pagination from '../../components/Pagination'
import Link from 'next/link'

const PAGE_SIZE = 10

function formatDate(value?: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function getCopyStatusColor(status: string): string {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800'
    case 'borrowed':
      return 'bg-blue-100 text-blue-800'
    case 'reserved':
      return 'bg-yellow-100 text-yellow-800'
    case 'maintenance':
      return 'bg-orange-100 text-orange-800'
    case 'lost':
      return 'bg-red-100 text-red-800'
    case 'deleted':
      return 'bg-gray-100 text-gray-500'
    default:
      return 'bg-gray-100 text-gray-800'
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

export default function AdminBooksPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showAddCopyModal, setShowAddCopyModal] = useState<{ bookId: string; bookTitle: string; bookIsbn?: string; existingCopiesCount: number } | null>(null)
  const [newCopyCode, setNewCopyCode] = useState('')
  const [newCopyLocation, setNewCopyLocation] = useState('')
  const [deleteCopyId, setDeleteCopyId] = useState<string | null>(null)

  const booksQuery = useBooks({ search, page, pageSize: PAGE_SIZE })

  // Fetch detailed book data with copies when expanded
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
      // Try different possible endpoints
      try {
        await axios.post(`/books/${bookId}/copies`, { code, location, status: 'available' })
      } catch (err: any) {
        // Fallback: try /copies endpoint
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          await axios.post('/copies', { bookId, code, location, status: 'available' })
        } else {
          throw err
        }
      }
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Copia creada exitosamente.' })
      setShowAddCopyModal(null)
      setNewCopyCode('')
      setNewCopyLocation('')
      queryClient.invalidateQueries({ queryKey: ['book', expandedBookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? 'No fue posible crear la copia.'
      setFeedback({ type: 'error', message })
    },
  })

  const updateCopyStatusMutation = useMutation({
    mutationFn: async ({ copyId, status }: { copyId: string; status: string }) => {
      await axios.patch(`/copies/${copyId}`, { status })
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Estado de la copia actualizado exitosamente.' })
      queryClient.invalidateQueries({ queryKey: ['book', expandedBookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? 'No fue posible actualizar el estado de la copia.'
      setFeedback({ type: 'error', message })
    },
  })

  const deleteCopyMutation = useMutation({
    mutationFn: async (copyId: string) => {
      // Try PATCH to set status to 'deleted' first
      try {
        await axios.patch(`/copies/${copyId}`, { status: 'deleted' })
      } catch (err: any) {
        // Fallback: try DELETE endpoint
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          await axios.delete(`/copies/${copyId}`)
        } else {
          throw err
        }
      }
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Copia eliminada exitosamente.' })
      setDeleteCopyId(null)
      queryClient.invalidateQueries({ queryKey: ['book', expandedBookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? 'No fue posible eliminar la copia.'
      setFeedback({ type: 'error', message })
    },
  })

  const toggleExpand = (bookId: string) => {
    if (expandedBookId === bookId) {
      setExpandedBookId(null)
    } else {
      setExpandedBookId(bookId)
    }
  }

  const generateCopyCode = (bookIsbn: string | undefined, existingCount: number): string => {
    if (bookIsbn) {
      // Use ISBN as prefix, remove non-alphanumeric characters
      const cleanIsbn = bookIsbn.replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase()
      return `${cleanIsbn}-${String(existingCount + 1).padStart(3, '0')}`
    }
    // Fallback: use sequential number
    return `COP-${String(existingCount + 1).padStart(4, '0')}`
  }

  const handleAddCopy = () => {
    if (!showAddCopyModal) return
    
    // Generate code automatically if not provided
    const code = newCopyCode.trim() || generateCopyCode(
      showAddCopyModal.bookIsbn,
      showAddCopyModal.existingCopiesCount
    )
    
    createCopyMutation.mutate({
      bookId: showAddCopyModal.bookId,
      code,
      location: newCopyLocation.trim() || undefined,
    })
  }

  const handleDeleteCopy = (copyId: string) => {
    setDeleteCopyId(copyId)
  }

  const confirmDeleteCopy = () => {
    if (!deleteCopyId) return
    deleteCopyMutation.mutate(deleteCopyId)
  }

  const books = booksQuery.data?.items ?? []
  const totalBooks = booksQuery.data?.meta.total ?? 0

  return (
    <AuthGuard roles={['ADMIN', 'LIBRARIAN']}>
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Libros y Copias</h1>
            <p className="text-sm text-gray-600 mt-1">Administra todos los libros y sus copias desde aquí.</p>
          </div>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Volver al panel
          </Link>
        </div>

        {feedback && (
          <div
            className={`rounded border p-3 text-sm ${
              feedback.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="rounded border bg-white p-4 shadow-sm">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>Buscar libros:</span>
            <input
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              placeholder="Buscar por título, autor o ISBN"
              className="flex-1 rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {booksQuery.isFetching && <span className="text-xs text-gray-500">Buscando…</span>}
          </label>
        </div>

        {booksQuery.isLoading ? (
          <div className="rounded border bg-white p-6 text-sm text-gray-600 shadow">Cargando libros…</div>
        ) : books.length === 0 ? (
          <div className="rounded border bg-white p-6 text-center text-sm text-gray-600 shadow">
            {search ? 'No se encontraron libros que coincidan con la búsqueda.' : 'No hay libros registrados.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded border bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Título</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Autor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ISBN</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Copias</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Disponibles</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {books.map((book: any) => {
                  const allCopies = book.copies || []
                  // Filter out deleted copies
                  const copies = allCopies.filter((c: any) => c.status !== 'deleted')
                  const availableCount = copies.filter((c: any) => c.status === 'available').length
                  const isExpanded = expandedBookId === book.id
                  const expandedBook = isExpanded ? expandedBookQuery.data : null
                  const allExpandedCopies = expandedBook?.copies || []
                  // Filter out deleted copies from expanded view
                  const displayCopies = allExpandedCopies.filter((c: any) => c.status !== 'deleted')

                  return (
                    <>
                      <tr key={book.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{book.title}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{book.author || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{book.isbn || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{copies.length}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                              availableCount > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {availableCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleExpand(book.id)}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                          >
                            {isExpanded ? 'Ocultar copias' : 'Ver copias'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-gray-50">
                            {expandedBookQuery.isLoading ? (
                              <div className="text-sm text-gray-600">Cargando copias…</div>
                            ) : displayCopies && displayCopies.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-semibold text-gray-700">
                                    Copias del libro ({displayCopies.length})
                                  </h3>
                                  <button
                                    onClick={() => {
                                      setShowAddCopyModal({ 
                                        bookId: book.id, 
                                        bookTitle: book.title,
                                        bookIsbn: book.isbn,
                                        existingCopiesCount: displayCopies.length
                                      })
                                      setNewCopyCode('')
                                      setNewCopyLocation('')
                                    }}
                                    className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-700"
                                  >
                                    + Agregar copia
                                  </button>
                                </div>
                                <div className="overflow-x-auto rounded border bg-white">
                                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600">Código</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600">Estado</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600">Ubicación</th>
                                        <th className="px-3 py-2 text-center font-medium text-gray-600">Acciones</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {displayCopies.map((copy: Copy) => (
                                        <tr key={copy.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 font-mono">
                                            {copy.code || `Copia ${copy.id.slice(0, 8)}`}
                                          </td>
                                          <td className="px-3 py-2">
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
                                              className={`rounded border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 ${getCopyStatusColor(copy.status)}`}
                                            >
                                              <option value="available">Disponible</option>
                                              <option value="borrowed">Prestado</option>
                                              <option value="reserved">Reservado</option>
                                              <option value="maintenance">En mantenimiento</option>
                                              <option value="lost">Perdido</option>
                                              <option value="deleted">Eliminado</option>
                                            </select>
                                          </td>
                                          <td className="px-3 py-2 text-gray-600">{copy.location || '—'}</td>
                                          <td className="px-3 py-2 text-center">
                                            <button
                                              onClick={() => handleDeleteCopy(copy.id)}
                                              disabled={deleteCopyMutation.isPending}
                                              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-semibold text-gray-700">No hay copias registradas</h3>
                                  <button
                                    onClick={() => {
                                      setShowAddCopyModal({ 
                                        bookId: book.id, 
                                        bookTitle: book.title,
                                        bookIsbn: book.isbn,
                                        existingCopiesCount: 0
                                      })
                                      setNewCopyCode('')
                                      setNewCopyLocation('')
                                    }}
                                    className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-700"
                                  >
                                    + Agregar primera copia
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between rounded border bg-white p-4">
          <div className="text-xs text-gray-600">
            {totalBooks === 1 ? '1 libro encontrado' : `${totalBooks} libros encontrados`}
          </div>
          <Pagination
            currentPage={page}
            totalItems={totalBooks}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>

        {/* Modal para agregar copia */}
        {showAddCopyModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded bg-white p-6">
              <h3 className="mb-2 text-lg font-semibold">Agregar copia</h3>
              <p className="mb-4 text-sm text-gray-600">{showAddCopyModal.bookTitle}</p>
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Código (opcional)</span>
                  <input
                    value={newCopyCode}
                    onChange={(e) => setNewCopyCode(e.target.value)}
                    placeholder={generateCopyCode(showAddCopyModal.bookIsbn, showAddCopyModal.existingCopiesCount)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  {!newCopyCode && (
                    <p className="mt-1 text-xs text-gray-500">
                      Si no especificas un código, se generará automáticamente: <span className="font-mono font-semibold">{generateCopyCode(showAddCopyModal.bookIsbn, showAddCopyModal.existingCopiesCount)}</span>
                    </p>
                  )}
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Ubicación (opcional)</span>
                  <input
                    value={newCopyLocation}
                    onChange={(e) => setNewCopyLocation(e.target.value)}
                    placeholder="Ej: Estante A-3"
                    className="mt-1 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAddCopyModal(null)
                      setNewCopyCode('')
                      setNewCopyLocation('')
                    }}
                    className="rounded bg-gray-200 px-3 py-1 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCopy}
                    disabled={createCopyMutation.isPending}
                    className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {createCopyMutation.isPending ? 'Creando…' : 'Crear copia'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar copia */}
        {deleteCopyId && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded bg-white p-6">
              <h3 className="mb-2 text-lg font-semibold text-red-700">Confirmar eliminación</h3>
              <p className="mb-4 text-sm text-gray-600">
                ¿Estás seguro de que deseas eliminar esta copia? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteCopyId(null)}
                  disabled={deleteCopyMutation.isPending}
                  className="rounded bg-gray-200 px-3 py-1 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCopy}
                  disabled={deleteCopyMutation.isPending}
                  className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {deleteCopyMutation.isPending ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
