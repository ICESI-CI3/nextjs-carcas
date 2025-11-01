import { useQuery } from '@tanstack/react-query'
import axios from '../../lib/api'
import BookCard from '../../components/BookCard'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import Link from 'next/link'

async function fetchBooks(){
  const { data } = await axios.get('/books')
  return data
}

export default function BooksPage(){
  const { data, isLoading, error } = useQuery({ queryKey: ['books'], queryFn: fetchBooks })

  function ClientOnlyCreateButton(){
    const [mounted, setMounted] = useState(false)
    const { hasRole } = useAuthContext()
    useEffect(() => { setMounted(true) }, [])
    if(!mounted) return null
    if(hasRole(['ADMIN','LIBRARIAN'])){
      return <Link href="/books/create" className="ml-4 px-3 py-2 bg-yellow-600 text-white rounded">Crear libro</Link>
    }
    return null
  }

  if(isLoading) return <div className="p-6">Cargando libros...</div>
  if(error) return <div className="p-6 text-red-600">Error cargando libros</div>

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">Libros</h1>
        <div className="ml-auto">
          <ClientOnlyCreateButton />
        </div>
      </div>

      <div className="space-y-4">
        {data && data.length > 0 ? data.map((b: any) => (
          <BookCard key={b.id} book={b} />
        )) : <div>No hay libros</div>}
      </div>
    </div>
  )
}
