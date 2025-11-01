import Link from 'next/link'
import { useAuthContext } from '../context/AuthContext'

export default function Header(){
  const { user, isAuthenticated, logout, hasRole } = useAuthContext()

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-bold">Biblioteca</Link>
        <nav className="flex items-center space-x-4">
          <Link href="/books">Libros</Link>
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              {hasRole(['ADMIN','LIBRARIAN']) && (
                <Link href="/admin" className="px-3 py-1 bg-gray-100 rounded">Admin</Link>
              )}
              <Link href="/my/loans" className="px-3 py-1 bg-gray-100 rounded">Mis préstamos</Link>
              <div className="px-3 py-1 bg-gray-50 rounded border text-sm">
                <div className="font-medium">{user?.email}</div>
                <div className="text-xs text-gray-500">{user?.role ?? 'N/A'}</div>
              </div>
              <button onClick={() => logout()} className="px-3 py-1 bg-red-500 text-white rounded">Cerrar sesión</button>
            </div>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
