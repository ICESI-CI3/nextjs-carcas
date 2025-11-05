import React from 'react'

type Props = {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

const Pagination: React.FC<Props> = ({ currentPage, totalItems, pageSize, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const canGoBack = currentPage > 1
  const canGoForward = currentPage < totalPages

  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }).map((_, idx) => idx + 1)

  return (
    <nav className="flex items-center justify-between border-t bg-white px-4 py-3 text-sm">
      <div className="text-xs text-gray-600">Página {currentPage} de {totalPages}</div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => canGoBack && onPageChange(currentPage - 1)}
          disabled={!canGoBack}
          className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Página anterior"
        >
          Prev
        </button>
        {pages.map(page => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`rounded px-3 py-1 ${page === currentPage ? 'bg-blue-600 text-white' : 'border'}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => canGoForward && onPageChange(currentPage + 1)}
          disabled={!canGoForward}
          className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Página siguiente"
        >
          Next
        </button>
      </div>
    </nav>
  )
}

export default Pagination
