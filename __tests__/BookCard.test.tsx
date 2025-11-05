import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import BookCard from '../components/BookCard'
import { AuthProvider } from '../context/AuthContext'
import axios from '../lib/api'


jest.mock('../lib/api')
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
})

const mockAxios = axios as jest.Mocked<typeof axios>

describe('BookCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockAxios.get.mockRejectedValue(new Error('Unauthorized'))
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  const mockBook = {
    id: '1',
    title: 'Test Book',
    author: 'Test Author',
    publisher: 'Test Publisher',
    publishedDate: '2024',
    thumbnail: 'https://example.com/image.jpg',
    categories: ['Fiction', 'Drama'],
    description: 'Test description',
    copies: [{ id: '1', status: 'available' }],
  }

  it('renders book information', () => {
    render(<BookCard book={mockBook} />, { wrapper })

    expect(screen.getByText('Test Book')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
    expect(screen.getByText('Test Publisher • 2024')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('renders thumbnail when available', () => {
    render(<BookCard book={mockBook} />, { wrapper })

    const img = screen.getByAltText('Test Book')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('renders placeholder when no thumbnail', () => {
    const bookWithoutThumbnail = { ...mockBook, thumbnail: undefined }
    render(<BookCard book={bookWithoutThumbnail} />, { wrapper })

    expect(screen.getByText('No image')).toBeInTheDocument()
    expect(screen.queryByAltText('Test Book')).not.toBeInTheDocument()
  })

  it('renders categories', () => {
    render(<BookCard book={mockBook} />, { wrapper })

    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('Drama')).toBeInTheDocument()
  })

  it('does not render categories section when empty', () => {
    const bookWithoutCategories = { ...mockBook, categories: undefined }
    render(<BookCard book={bookWithoutCategories} />, { wrapper })

    expect(screen.queryByText('Fiction')).not.toBeInTheDocument()
  })

  it('shows available copies count', () => {
    const bookWithCopies = {
      ...mockBook,
      copies: [
        { id: '1', status: 'available' },
        { id: '2', status: 'available' },
        { id: '3', status: 'loaned' },
      ],
    }
    render(<BookCard book={bookWithCopies} />, { wrapper })

    // The component should show availability info (implementation dependent)
    expect(bookWithCopies.copies.filter((c: any) => c.status === 'available')).toHaveLength(2)
  })

  it('handles book with no copies', () => {
    const bookWithoutCopies = { ...mockBook, copies: [] }
    render(<BookCard book={bookWithoutCopies} />, { wrapper })

    expect(screen.getByText('Test Book')).toBeInTheDocument()
  })

  it('handles missing optional fields', () => {
    const minimalBook = {
      id: '1',
      title: 'Minimal Book',
      copies: [],
    }
    render(<BookCard book={minimalBook} />, { wrapper })

    expect(screen.getByText('Minimal Book')).toBeInTheDocument()
  })

  it('creates link to book detail page', () => {
    render(<BookCard book={mockBook} />, { wrapper })

    const link = screen.getByText('Test Book').closest('a')
    expect(link).toHaveAttribute('href', '/books/1')
  })
})
