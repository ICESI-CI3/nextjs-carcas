import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import axios from '../../lib/api'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import Link from 'next/link'

async function fetchBook(id: string){
  const { data } = await axios.get(`/books/${id}`)
  return data
}

function ClientOnlyEditButton({ id }: { id: string }){
  const [mounted, setMounted] = useState(false)
  const { hasRole } = useAuthContext()

  useEffect(() => { setMounted(true) }, [])

  if(!mounted) return null
  if(hasRole(['ADMIN','LIBRARIAN'])){
    return (
      <Link href={`/books/${id}/edit`} className="block w-full text-center px-4 py-2 bg-yellow-500 text-white rounded">Editar libro</Link>
    )
  }
  return null
}

export default function BookDetail(){
  const router = useRouter()
  const { id } = router.query as { id?: string }

  const { data, isLoading, error } = useQuery({
    queryKey: ['book', id],
    queryFn: () => fetchBook(id as string),
    enabled: !!id,
  })

  if(isLoading) return <div className="p-6">Cargando...</div>
  if(error) return <div className="p-6 text-red-600">Error al cargar libro</div>
  if(!data) return <div className="p-6">Libro no encontrado</div>

  const book = data

  // map short language codes to human-friendly names
  const languageNames: Record<string,string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    zh: 'Chinese',
  }

  function formatDate(d?: string){
    if(!d) return '—'
    try{ return new Date(d).toLocaleDateString() }catch{ return d }
  }

  const copies = book.copies || []
  const availableCount = copies.filter((c: any) => c.status === 'available').length

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3">
          {book.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.thumbnail} alt={book.title} className="w-full rounded shadow" />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded shadow flex items-center justify-center">No image</div>
          )}
        </div>

        <div className="md:col-span-6">
          <h1 className="text-3xl font-bold">{book.title}</h1>
          <div className="text-sm text-gray-600 mt-1">{book.author}</div>

          {book.categories && (
            <div className="mt-2 flex flex-wrap gap-2">
              {book.categories.map((c: string) => (
                <span key={c} className="text-xs bg-gray-100 px-2 py-1 rounded">{c}</span>
              ))}
            </div>
          )}

          {book.description && (
            <div className="mt-6 text-gray-800 leading-relaxed">{book.description}</div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div><span className="font-semibold">Editorial:</span> {book.publisher ?? '—'}</div>
            <div><span className="font-semibold">Publicado:</span> {formatDate(book.publishedDate)}</div>
            <div><span className="font-semibold">Páginas:</span> {book.pageCount ?? '—'}</div>
            <div><span className="font-semibold">Idioma:</span> {languageNames[book.language] ? `${languageNames[book.language]} (${book.language})` : book.language ?? '—'}</div>
          </div>
        </div>

        <aside className="md:col-span-3 p-4 border rounded">
          <div className="mb-4">
            <div className="text-lg font-semibold">Acciones</div>
          </div>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded">Reservar copia</button>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded">Solicitar préstamo</button>
            <ClientOnlyEditButton id={id as string} />
          </div>

          <div className="mt-6 text-sm text-gray-700">
            <div><span className="font-semibold">ISBN:</span> {book.isbn}</div>
            <div className="mt-2"><span className="font-semibold">Código (ID):</span> {book.id}</div>
            <div className="mt-2"><span className="font-semibold">Copias:</span> {copies.length} — <span className="font-semibold">Disponibles:</span> {availableCount}</div>
          </div>

          {copies.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Listado de copias</div>
              <ul className="text-sm space-y-2">
                {copies.map((c: any) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <div>{c.code}</div>
                    <div className={`px-2 py-1 text-xs rounded ${c.status === 'available' ? 'bg-green-100 text-green-800' : c.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                      {c.status}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
