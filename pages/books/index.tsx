import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import BookCard from '../../components/BookCard'
import Pagination from '../../components/Pagination'
import useAuth from '../../hooks/useAuth'
import useDebounce from '../../hooks/useDebounce'
import { useBooks } from '../../hooks/useBooks'

const PAGE_SIZE = 6

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-gray-600">Cargando libros...</p>
    </div>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-5xl mb-4">📚</div>
      <p className="text-lg font-semibold text-gray-900 mb-2">
        {search ? 'No se encontraron resultados' : 'Aún no hay libros registrados'}
      </p>
      <p className="text-sm text-gray-500 text-center max-w-md">
        {search
          ? 'Intenta ajustar tus términos de búsqueda o explorar otros títulos'
          : 'El catálogo estará disponible cuando se agreguen libros al sistema'}
      </p>
    </div>
  )
}

export default function BooksPage() {
  const router = useRouter()
  const { hasRole } = useAuth()
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!router.isReady) return
    const querySearch = typeof router.query.q === 'string' ? router.query.q : ''
    const queryPage = Number(router.query.page ?? 1)

    setSearchValue(querySearch)
    setPage(Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1)
  }, [router.isReady])

  const debouncedSearch = useDebounce(searchValue, 400)

  useEffect(() => {
    if (!router.isReady) return
    const query: Record<string, string> = {}
    if (debouncedSearch.trim()) query.q = debouncedSearch.trim()
    if (page > 1) query.page = String(page)

    router.replace({ pathname: '/books', query }, undefined, { shallow: true })
  }, [debouncedSearch, page, router])

  const { data, isLoading, error, isFetching } = useBooks({
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  })

  const totalBooks = data?.meta.total ?? 0
  const canCreate = hasRole(['ADMIN', 'LIBRARIAN'])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Catálogo de Libros</h1>
              <p className="mt-2 text-sm text-gray-600">
                Explora nuestro inventario completo. Busca por título, autor o ISBN.
              </p>
            </div>
            {canCreate && (
              <Link
                href="/books/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <span>+</span>
                <span>Crear libro</span>
              </Link>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">🔍</span>
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => {
                setPage(1)
                setSearchValue(event.target.value)
              }}
              placeholder="Buscar por título, autor o ISBN..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              aria-label="Buscar libros"
            />
            {isFetching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        {data && (
          <div className="mb-4 text-sm text-gray-600">
            {totalBooks === 1 ? (
              <span>Se encontró <span className="font-semibold text-gray-900">1 libro</span></span>
            ) : (
              <span>
                Se encontraron <span className="font-semibold text-gray-900">{totalBooks} libros</span>
              </span>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-600 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-800">Error al cargar libros</p>
                <p className="mt-1 text-xs text-red-600">
                  No se pudo cargar el listado. Intenta nuevamente más tarde.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading && !data ? (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <LoadingState />
          </div>
        ) : (
          <>
            {data && data.items.length > 0 ? (
              <div className="space-y-4">
                {data.items.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <EmptyState search={searchValue} />
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {data && data.items.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalItems={totalBooks}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
