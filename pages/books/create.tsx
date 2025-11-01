import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import axios from '../../lib/api'
import { useAuthContext } from '../../context/AuthContext'

function normalizeCategories(input: string){
  return input.split(',').map(s => s.trim()).filter(Boolean)
}

export default function CreateBookPage(){
  const router = useRouter()
  const { hasRole } = useAuthContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if(mounted && !hasRole(['ADMIN','LIBRARIAN'])){
      router.replace('/books')
    }
  }, [mounted, hasRole, router])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<any>({
    isbn: '', title: '', author: '', publisher: '', publishedDate: '', description: '', pageCount: '', categories: '', language: '', thumbnail: ''
  })

  // Google Books search/autocomplete state (triggered from the Title field)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<number | null>(null)

  async function handleEnrich(){
    if(!form.isbn) return setError('Ingrese ISBN para enriquecer')
    setError(null)
    setLoading(true)
    try{
      // backend exposes Google Books enrich under /google-books/enrich/:isbn
      const { data } = await axios.post(`/google-books/enrich/${encodeURIComponent(form.isbn)}`)
      // map returned data into form fields (best-effort)
      setForm((f: any) => ({
        ...f,
        isbn: data.isbn ?? f.isbn,
        title: data.title ?? f.title,
        author: data.author ?? f.author,
        publisher: data.publisher ?? f.publisher,
        publishedDate: data.publishedDate ? new Date(data.publishedDate).toISOString().slice(0,10) : f.publishedDate,
        description: data.description ?? f.description,
        pageCount: data.pageCount ?? f.pageCount,
        categories: Array.isArray(data.categories) ? data.categories.join(', ') : f.categories,
        language: data.language ?? f.language,
        thumbnail: data.thumbnail ?? f.thumbnail,
      }))
    }catch(err:any){
      setError(err?.response?.data?.message || String(err))
    }finally{ setLoading(false) }
  }

  // Search Google Books by title when user types in the Title field (debounced)
  useEffect(() => {
    if (searchRef.current) window.clearTimeout(searchRef.current)
    const q = form.title || ''
    if (!q || q.trim().length < 3) {
      setSuggestions([])
      return
    }
    setSearching(true)
    // debounce
    searchRef.current = window.setTimeout(async () => {
      try{
        const res = await axios.get('/google-books/search', { params: { q } })
        setSuggestions(res.data.items || [])
      }catch(err){
        setSuggestions([])
      }finally{
        setSearching(false)
      }
    }, 400)
    return () => { if(searchRef.current) window.clearTimeout(searchRef.current) }
  }, [form.title])

  function applySuggestion(item: any){
    const info = item.volumeInfo || {}
    // pick an ISBN if present (prefer ISBN_13)
    let foundIsbn = ''
    if(Array.isArray(info.industryIdentifiers)){
      const isbn13 = info.industryIdentifiers.find((id: any) => id.type === 'ISBN_13')
      const isbn10 = info.industryIdentifiers.find((id: any) => id.type === 'ISBN_10')
      foundIsbn = (isbn13 && isbn13.identifier) || (isbn10 && isbn10.identifier) || ''
    }
    // Only autofill ISBN per user request
    setForm((f:any) => ({ ...f, isbn: foundIsbn || f.isbn }))
    setSuggestions([])
  }

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
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
      const { data } = await axios.post('/books', payload)
      router.push(`/books/${data.id}`)
    }catch(err:any){
      setError(err?.response?.data?.message || String(err))
    }finally{ setLoading(false) }
  }

  function updateField(k: string, v: any){ setForm((f:any) => ({ ...f, [k]: v })) }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Crear libro</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block">
            <div className="text-sm font-medium">ISBN <span className="text-red-500">*</span></div>
            <input value={form.isbn} onChange={e => updateField('isbn', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={handleEnrich} disabled={loading || !form.isbn} className="px-4 py-2 bg-indigo-600 text-white rounded">Enrich</button>
            <div className="text-sm text-gray-500 self-center">Autocompleta desde Google Books</div>
          </div>

          <label className="block">
            <div className="text-sm font-medium">Título <span className="text-red-500">*</span></div>
            <input value={form.title} onChange={e => updateField('title', e.target.value)} className="mt-1 w-full border p-2 rounded" />
          </label>
          {searching && <div className="text-sm text-gray-500 mt-1">Buscando títulos...</div>}
          {suggestions.length > 0 && (
            <ul className="border rounded mt-2 max-h-48 overflow-auto bg-white z-50">
              {suggestions.map((it, idx) => (
                <li key={idx} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => applySuggestion(it)}>
                  <div className="font-medium">{it.volumeInfo?.title}</div>
                  <div className="text-xs text-gray-500">{Array.isArray(it.volumeInfo?.authors) ? it.volumeInfo.authors.join(', ') : ''}</div>
                </li>
              ))}
            </ul>
          )}
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
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">Crear</button>
            <button type="button" onClick={() => router.push('/books')} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>
      </form>
    </div>
  )
}
