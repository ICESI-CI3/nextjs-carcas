import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import axios from '../../../lib/api'
import AuthGuard from '../../../components/AuthGuard'

function normalizeCategories(input: string){
  return input.split(',').map(s => s.trim()).filter(Boolean)
}

export default function EditBookPage(){
  const router = useRouter()
  const { id } = router.query as { id?: string }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [form, setForm] = useState<any>({ isbn: '', title: '', author: '', publisher: '', publishedDate: '', description: '', pageCount: '', categories: '', language: '', thumbnail: '' })

  useEffect(() => {
    if(!id) return
    let mounted = true
    setLoading(true)
    axios.get(`/books/${id}`).then(res => {
      if(!mounted) return
      const data = res.data
      setForm({
        isbn: data.isbn ?? '',
        title: data.title ?? '',
        author: data.author ?? '',
        publisher: data.publisher ?? '',
        publishedDate: data.publishedDate ? new Date(data.publishedDate).toISOString().slice(0,10) : '',
        description: data.description ?? '',
        pageCount: data.pageCount ?? '',
        categories: Array.isArray(data.categories) ? data.categories.join(', ') : '',
        language: data.language ?? '',
        thumbnail: data.thumbnail ?? '',
      })
    }).catch(() => setError('No se pudo cargar el libro')).finally(() => setLoading(false))
    return () => { mounted = false }
  }, [id])

  async function handleEnrich(){
    if(!form.isbn) return setError('Ingrese ISBN para enriquecer')
    setError(null)
    setLoading(true)
    try{
      const res = await axios.post(`/google-books/enrich/${encodeURIComponent(form.isbn)}`)
      // endpoint may return the metadata directly or wrap it (e.g. { book: {...} })
      let data = res.data
      if (data && data.book) data = data.book
      // if response doesn't contain expected fields, treat as no-op
      setForm((f:any) => ({
        ...f,
        title: data?.title ?? f.title,
        author: data?.author ?? f.author,
        publisher: data?.publisher ?? f.publisher,
        publishedDate: data?.publishedDate ? new Date(data.publishedDate).toISOString().slice(0,10) : f.publishedDate,
        description: data?.description ?? f.description,
        pageCount: data?.pageCount ?? f.pageCount,
        categories: Array.isArray(data?.categories) ? data.categories.join(', ') : f.categories,
        language: data?.language ?? f.language,
        thumbnail: data?.thumbnail ?? f.thumbnail,
      }))
      setFeedback({ type: 'success', message: 'Datos cargados desde Google Books.' })
    }catch(err:any){
      setError(err?.response?.data?.message || String(err))
    }finally{ setLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    if(!id) return
    setError(null)
    setLoading(true)
    try{
      const payload = {
        isbn: form.isbn,
        title: form.title,
        author: form.author,
        publisher: form.publisher,
        publishedDate: form.publishedDate || undefined,
        description: form.description,
        pageCount: form.pageCount ? Number(form.pageCount) : undefined,
        categories: normalizeCategories(form.categories),
        language: form.language,
        thumbnail: form.thumbnail,
      }
      await axios.patch(`/books/${id}`, payload)
      router.push(`/books/${id}`)
    }catch(err:any){
      setError(err?.response?.data?.message || String(err))
    }finally{ setLoading(false) }
  }

  function updateField(k: string, v: any){ setForm((f:any) => ({ ...f, [k]: v })) }

  return (
    <AuthGuard roles={['ADMIN', 'LIBRARIAN']}>
      <div className="container mx-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">Editar libro</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block">
            <div className="text-sm font-medium">ISBN</div>
            <input value={form.isbn} onChange={e => updateField('isbn', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={handleEnrich} disabled={loading || !form.isbn} className="px-4 py-2 bg-indigo-600 text-white rounded">Enrich</button>
            <div className="text-sm text-gray-500 self-center">Autocompleta desde Google Books</div>
          </div>

          <label className="block">
            <div className="text-sm font-medium">Título</div>
            <input value={form.title} onChange={e => updateField('title', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Autor</div>
            <input value={form.author} onChange={e => updateField('author', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Editorial</div>
            <input value={form.publisher} onChange={e => updateField('publisher', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Fecha de publicación</div>
            <input type="date" value={form.publishedDate} onChange={e => updateField('publishedDate', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="text-sm font-medium">Descripción</div>
            <textarea value={form.description} onChange={e => updateField('description', e.target.value)} className="mt-1 w-full border p-2 rounded h-40" />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Páginas</div>
            <input type="number" value={form.pageCount} onChange={e => updateField('pageCount', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Categorias (separadas por coma)</div>
            <input value={form.categories} onChange={e => updateField('categories', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Idioma (ej: en, es)</div>
            <input value={form.language} onChange={e => updateField('language', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Thumbnail URL</div>
            <input value={form.thumbnail} onChange={e => updateField('thumbnail', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white">Guardar</button>
            <button
              type="button"
              onClick={async () => {
                if(!id) return
                setFeedback(null)
                setLoading(true)
                try{
                  const res = await axios.get('/copies')
                  const copies: any[] = Array.isArray(res.data) ? res.data : []

                  const bookCopies = copies.filter(c => String(c.bookId) === String(id))

                  // prefer ISBN-based codes: COPY-<ISBN>-<n>
                  const isbnRaw = String(form.isbn || '')
                  const isbn = isbnRaw.replace(/\s+/g, '')

                  let nextCode = ''

                  if (isbn) {
                    // find existing copies for this book that follow COPY-<ISBN>-<num>
                    const prefix = `COPY-${isbn}-`
                    let maxNum = 0
                    for (const c of bookCopies) {
                      const code = String(c.code || '')
                      if (!code.startsWith(prefix)) continue
                      const suffix = code.substring(prefix.length)
                      const num = parseInt(suffix, 10)
                      if (!isNaN(num) && num > maxNum) maxNum = num
                    }
                    let nextNum = maxNum + 1
                    // try to create, and if the server reports the code already exists (409 / conflict), retry with next number
                    const prefixBase = prefix
                    const maxAttempts = 20
                    let created = false
                    for (let attempt = 0; attempt < maxAttempts; attempt++) {
                      const candidate = `${prefixBase}${nextNum}`
                      try {
                        await axios.post('/copies', { code: candidate, bookId: id, status: 'available' })
                        nextCode = candidate
                        created = true
                        break
                      } catch (postErr: any) {
                        const msg = (postErr?.response?.data?.message || '').toLowerCase()
                        const status = postErr?.response?.status
                        if (status === 409 || msg.includes('already exists') || msg.includes('exists')) {
                          // conflict: try next
                          nextNum += 1
                          continue
                        }
                        throw postErr
                      }
                    }
                    if (!created) throw new Error('No fue posible crear la copia después de varios intentos por conflicto de código')
                  } else {
                    // fallback to previous prefix-based fallback when ISBN is not available
                    function splitPrefixAndSuffix(code: string){
                      const idx = code.lastIndexOf('-')
                      if(idx === -1) return { prefix: code, suffix: '' }
                      return { prefix: code.substring(0, idx), suffix: code.substring(idx + 1) }
                    }

                    let bookPrefix = 'COPY-001'
                    if(bookCopies.length > 0){
                      const firstCode = String(bookCopies[0].code || '')
                      bookPrefix = splitPrefixAndSuffix(firstCode).prefix || bookPrefix
                    } else {
                      const counts: Record<string, number> = {}
                      for(const c of copies){
                        const code = String(c.code || '')
                        const { prefix } = splitPrefixAndSuffix(code)
                        if(prefix) counts[prefix] = (counts[prefix] || 0) + 1
                      }
                      const keys = Object.keys(counts)
                      if(keys.length){
                        keys.sort((a,b) => counts[b] - counts[a])
                        bookPrefix = keys[0]
                      }
                    }

                    let maxNum = 0
                    for(const c of copies){
                      const code = String(c.code || '')
                      if(!code.startsWith(bookPrefix + '-')) continue
                      const { suffix } = splitPrefixAndSuffix(code)
                      const num = parseInt(suffix, 10)
                      if(!isNaN(num) && num > maxNum) maxNum = num
                    }
                    const startNum = maxNum + 1
                    let nextNum = startNum
                    const basePrefix = `${bookPrefix}-`
                    const maxAttempts = 20
                    let created = false
                    for (let attempt = 0; attempt < maxAttempts; attempt++) {
                      const candidate = `${basePrefix}${nextNum}`
                      try {
                        await axios.post('/copies', { code: candidate, bookId: id, status: 'available' })
                        nextCode = candidate
                        created = true
                        break
                      } catch (postErr: any) {
                        const msg = (postErr?.response?.data?.message || '').toLowerCase()
                        const status = postErr?.response?.status
                        if (status === 409 || msg.includes('already exists') || msg.includes('exists')) {
                          nextNum += 1
                          continue
                        }
                        throw postErr
                      }
                    }
                    if (!created) throw new Error('No fue posible crear la copia después de varios intentos por conflicto de código')
                  }
                  // success path: nextCode already set by the creation loop above
                  setFeedback({ type: 'success', message: `Copia creada correctamente: ${nextCode}` })
                }catch(err:any){
                  setFeedback({ type: 'error', message: err?.response?.data?.message || String(err) })
                }finally{ setLoading(false) }
              }}
              disabled={loading}
              className="rounded bg-green-600 px-4 py-2 text-white"
            >Crear copia</button>
            <button type="button" onClick={() => router.push(`/books/${id}`)} className="rounded bg-gray-200 px-4 py-2">Atras</button>
            <div className="ml-2">
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >Eliminar libro</button>
              ) : (
                <div className="rounded border border-red-200 bg-red-50 p-3">
                  <div className="text-sm font-medium text-red-700">Confirma eliminación</div>
                  <div className="mb-2 text-xs text-gray-600">¿Seguro que deseas eliminar este libro? Esta acción no se puede deshacer.</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if(!id) return
                        setLoading(true)
                        setError(null)
                        try{
                          await axios.delete(`/books/${id}`)
                          router.push('/books')
                        }catch(err:any){
                          setError(err?.response?.data?.message || String(err))
                        }finally{ setLoading(false); setShowConfirmDelete(false) }
                      }}
                      disabled={loading}
                      className="rounded bg-red-600 px-3 py-1 text-white"
                    >Confirmar</button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      disabled={loading}
                      className="rounded bg-gray-200 px-3 py-1"
                    >Atras</button>
                  </div>
                </div>
              )}
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            {feedback && (
              <div className={`rounded border p-3 text-sm ${feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {feedback.message}
              </div>
            )}
          </div>
        </div>
      </form>
      </div>
    </AuthGuard>
  )
}
