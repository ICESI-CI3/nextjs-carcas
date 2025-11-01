import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../context/AuthContext'

function ClientOnlyEditLink({ id }: { id: string }){
  const [mounted, setMounted] = useState(false)
  const { hasRole } = useAuthContext()

  useEffect(() => { setMounted(true) }, [])
  if(!mounted) return null
  if(hasRole(['ADMIN','LIBRARIAN'])){
    return <Link href={`/books/${id}/edit`} className="px-3 py-2 bg-yellow-500 text-white rounded">Editar</Link>
  }
  return null
}

export default function BookCard({ book }: { book: any }){
  // compute copies info
  const copies = book.copies || []
  const availableCount = copies.filter((c: any) => c.status === 'available').length
  const { isAuthenticated } = useAuthContext()

  const canReserve = isAuthenticated && availableCount > 0

  return (
    <article className="bg-white rounded shadow overflow-hidden md:flex">
      <div className="md:w-1/4 w-full">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt={book.title} className="w-full h-52 md:h-full object-cover" />
        ) : (
          <div className="w-full h-52 md:h-full bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>

      <div className="p-4 flex-1">
        <h3 className="text-lg font-semibold">{book.title}</h3>
        <p className="text-sm text-gray-600">{book.author}</p>
        {book.publisher && <p className="text-xs text-gray-500 mt-1">{book.publisher} • {book.publishedDate}</p>}

        {book.categories && (
          <div className="mt-2 flex flex-wrap gap-2">
            {book.categories.map((c: string) => (
              <span key={c} className="text-xs bg-gray-100 px-2 py-1 rounded">{c}</span>
            ))}
          </div>
        )}

        {book.description && (
          <p className="mt-3 text-sm text-gray-700 line-clamp-3">{book.description}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Link href={`/books/${book.id}`} className="px-3 py-2 bg-blue-600 text-white rounded">Ver detalle</Link>
          {canReserve ? (
            <Link
              href={{ pathname: `/books/${book.id}`, query: { action: 'reserve' } }}
              className="px-3 py-2 bg-green-600 text-white rounded"
            >
              Reservar
            </Link>
          ) : (
            <span className="px-3 py-2 text-sm text-gray-500">{availableCount > 0 ? 'Inicia sesión para reservar' : 'Sin copias disponibles'}</span>
          )}
          <ClientOnlyEditLink id={book.id} />
        </div>
      </div>

      <aside className="md:w-1/6 w-full border-l p-4 flex flex-col items-start gap-3">
        {book.pageCount && <div className="text-sm text-gray-600">{book.pageCount} páginas</div>}
        {book.language && <div className="text-sm text-gray-600">Idioma: {book.language}</div>}
        <div className="text-sm text-gray-600">Copias: {copies.length} • Disponibles: {availableCount}</div>
        <div className="mt-auto w-full">
          <div className="text-xs text-gray-500">ISBN</div>
          <div className="text-sm font-mono break-all">{book.isbn}</div>
        </div>
      </aside>
    </article>
  )
}
