import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto max-w-xl rounded-lg border bg-white p-8 text-center shadow-lg">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-blue-600">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">Página no encontrada</h2>
        </div>
        <p className="mt-4 text-gray-600">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Verifica la URL o regresa a la página principal.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-block rounded bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
          >
            Ir al inicio
          </Link>
          <Link
            href="/books"
            className="inline-block rounded border border-blue-600 px-6 py-2 text-blue-600 transition hover:bg-blue-50"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  )
}

