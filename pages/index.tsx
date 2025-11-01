import Link from 'next/link'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Biblioteca - Frontend</h1>
      <p className="mb-6">Proyecto scaffold para el taller de Next.js.</p>
      <div className="space-x-4">
        <Link href="/books" className="text-blue-600 underline">Ver libros</Link>
        <Link href="/login" className="text-blue-600 underline">Iniciar sesión</Link>
      </div>
    </main>
  )
}
