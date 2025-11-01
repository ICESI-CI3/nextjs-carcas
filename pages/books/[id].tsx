import { useRouter } from 'next/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from '../../lib/api'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useAuth from '../../hooks/useAuth'
import { useAuthContext } from '../../context/AuthContext'

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

  const queryClient = useQueryClient()
  const { isAuthenticated, hasRole } = useAuth()
  const [selectedCopyId, setSelectedCopyId] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const actionParam = typeof router.query?.action === 'string' ? router.query.action : null
  const isStaff = hasRole(['ADMIN', 'LIBRARIAN'])

  const copies = useMemo(() => (Array.isArray((data as any)?.copies) ? (data as any).copies : []), [data])
  const availableCopies = useMemo(() => copies.filter((copy: any) => copy.status === 'available'), [copies])
  const selectedCopy = useMemo(() => copies.find((copy: any) => copy.id === selectedCopyId) ?? null, [copies, selectedCopyId])

  useEffect(() => {
    if (!copies.length) {
      setSelectedCopyId('')
      return
    }
    const alreadySelected = copies.some((copy: any) => copy.id === selectedCopyId)
    if (!alreadySelected) {
      const fallback = availableCopies[0]?.id ?? copies[0]?.id ?? ''
      if (fallback) setSelectedCopyId(fallback)
    }
  }, [copies, availableCopies, selectedCopyId])

  useEffect(() => {
    if (actionParam === 'reserve' && availableCopies[0]) {
      setSelectedCopyId(availableCopies[0].id)
    }
  }, [actionParam, availableCopies])

  const reserveMutation = useMutation({
    mutationFn: async (copyId: string) => {
      if (!copyId) throw new Error('Selecciona una copia disponible para continuar')
      await axios.post('/reservations', { copyId })
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Reserva creada exitosamente.' })
      queryClient.invalidateQueries({ queryKey: ['book', id] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
    },
    onError: (mutationError: any) => {
      const message = mutationError?.response?.data?.message ?? mutationError?.message ?? 'No fue posible crear la reserva.'
      setFeedback({ type: 'error', message })
    },
  })

  const loanMutation = useMutation({
    mutationFn: async (copyId: string) => {
      if (!copyId) throw new Error('Selecciona una copia para generar el préstamo')
      await axios.post('/loans', { copyId })
    },
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Préstamo registrado correctamente.' })
      queryClient.invalidateQueries({ queryKey: ['book', id] })
      queryClient.invalidateQueries({ queryKey: ['my-loans'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
    },
    onError: (mutationError: any) => {
      const message = mutationError?.response?.data?.message ?? mutationError?.message ?? 'No fue posible crear el préstamo.'
      setFeedback({ type: 'error', message })
    },
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

  const availableCount = availableCopies.length
  const canReserve = isAuthenticated && selectedCopy?.status === 'available'

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

        <aside className="md:col-span-3 rounded border p-4">
          <div className="mb-4 space-y-1">
            <div className="text-lg font-semibold">Acciones</div>
            <p className="text-xs text-gray-500">Selecciona una copia para reservarla o registrar un préstamo.</p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Copia</span>
              <select
                value={selectedCopyId}
                onChange={event => setSelectedCopyId(event.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {copies.length === 0 ? (
                  <option value="" disabled>No hay copias registradas</option>
                ) : (
                  copies.map((copy: any) => (
                    <option key={copy.id} value={copy.id}>
                      {(copy.code || `Copia ${copy.id.slice(0, 6)}`)} — {copy.status}
                    </option>
                  ))
                )}
              </select>
            </label>

            {selectedCopy && (
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                <div><span className="font-semibold">Estado:</span> {selectedCopy.status}</div>
                {selectedCopy.location && (
                  <div><span className="font-semibold">Ubicación:</span> {selectedCopy.location}</div>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
                Necesitas iniciar sesión para realizar reservas.
              </div>
            )}

            <button
              type="button"
              onClick={() => reserveMutation.mutate(selectedCopyId)}
              disabled={!canReserve || reserveMutation.isPending}
              className="w-full rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {reserveMutation.isPending ? 'Reservando…' : 'Reservar copia'}
            </button>

            {availableCount === 0 && (
              <p className="text-xs text-gray-500">Todas las copias están reservadas o en préstamo.</p>
            )}

            {isStaff && (
              <button
                type="button"
                onClick={() => loanMutation.mutate(selectedCopyId)}
                disabled={!selectedCopyId || loanMutation.isPending}
                className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loanMutation.isPending ? 'Registrando…' : 'Registrar préstamo'}
              </button>
            )}

            {!isStaff && isAuthenticated && (
              <p className="text-xs text-gray-500">Los préstamos sólo pueden ser gestionados por personal autorizado.</p>
            )}

            <ClientOnlyEditButton id={id as string} />

            {feedback && (
              <div className={`rounded border p-3 text-xs ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {feedback.message}
              </div>
            )}
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
