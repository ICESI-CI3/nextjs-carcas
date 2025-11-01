import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import BookCard from '../../components/BookCard'
import Pagination from '../../components/Pagination'
import useAuth from '../../hooks/useAuth'
import useDebounce from '../../hooks/useDebounce'
import { useBooks } from '../../hooks/useBooks'

const PAGE_SIZE = 6

export default function BooksPage(){
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
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de libros</h1>
          <p className="text-sm text-gray-600">Explora el inventario disponible. Usa la búsqueda para filtrar por título, autor o ISBN.</p>
        </div>
        {canCreate && (
          <Link href="/books/create" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
            Crear libro
          </Link>
        )}
      </div>

      <form
        className="flex flex-col gap-3 rounded border bg-white p-4 shadow-sm md:flex-row md:items-center"
        onSubmit={event => event.preventDefault()}
      >
        <label className="flex flex-1 items-center gap-2 text-sm text-gray-600">
          <span className="sr-only">Buscar libros</span>
          <input
            value={searchValue}
            onChange={event => {
              setPage(1)
              setSearchValue(event.target.value)
            }}
            placeholder="Buscar por título, autor o ISBN"
            className="w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            aria-label="Buscar libros"
          />
        </label>
        {isFetching && (
          <span className="text-xs text-gray-500">Actualizando resultados…</span>
        )}
      </form>

      <div className="text-xs text-gray-500">
        {data ? (
          totalBooks === 1 ? '1 libro encontrado' : `${totalBooks} libros encontrados`
        ) : 'Resultados pendientes de carga'}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar el listado de libros. Intenta nuevamente más tarde.
        </div>
      )}

      {isLoading && !data ? (
        <div className="flex items-center justify-center rounded border bg-white p-10 text-sm text-gray-600 shadow">Cargando libros…</div>
      ) : (
        <div className="space-y-4">
          {data && data.items.length > 0 ? (
            data.items.map(book => <BookCard key={book.id} book={book} />)
          ) : (
            <div className="rounded border bg-white p-10 text-center text-sm text-gray-600 shadow">
              {searchValue ? 'No encontramos libros que coincidan con tu búsqueda.' : 'Aún no hay libros registrados.'}
            </div>
          )}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalItems={totalBooks}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  )
}
