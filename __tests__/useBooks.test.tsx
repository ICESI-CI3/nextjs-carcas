import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import '@testing-library/jest-dom'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBooks } from '../hooks/useBooks'
import axios from '../lib/api'


jest.mock('../lib/api')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('useBooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    jest.clearAllMocks()
    mockAxios.get.mockReset()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('fetches books with pagination', async () => {
    const mockResponse = {
      items: [{ id: '1', title: 'Book 1' }, { id: '2', title: 'Book 2' }],
      meta: { total: 2, page: 1, pageSize: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useBooks({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(mockAxios.get).toHaveBeenCalledWith('/books', {
      params: { page: 1, limit: 10 },
    })
  })

  it('handles search parameter', async () => {
    const mockResponse = {
      items: [{ id: '1', title: 'Book 1' }],
      meta: { total: 1, page: 1, pageSize: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useBooks({ search: 'test query', page: 1 }), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockAxios.get).toHaveBeenCalledWith('/books', {
      params: { search: 'test query', page: 1, limit: 10 },
    })
  })

  it('trims search parameter', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: { items: [], meta: { total: 0, page: 1, pageSize: 10 } } })

    renderHook(() => useBooks({ search: '  spaced  ', page: 1 }), { wrapper })

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalled()
    })

    const callArgs = mockAxios.get.mock.calls[0][1]
    expect(callArgs.params.search).toBe('spaced')
  })

  it('handles array response format', async () => {
    const mockArray = [
      { id: '1', title: 'Book 1' },
      { id: '2', title: 'Book 2' },
      { id: '3', title: 'Book 3' },
      { id: '4', title: 'Book 4' },
    ]
    mockAxios.get.mockResolvedValueOnce({ data: mockArray })

    const { result } = renderHook(() => useBooks({ page: 2, pageSize: 2 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toHaveLength(2)
    expect(result.current.data?.items[0]).toEqual({ id: '3', title: 'Book 3' })
    expect(result.current.data?.meta.total).toBe(4)
    expect(result.current.data?.meta.page).toBe(2)
  })

  it('handles response with data property', async () => {
    const mockResponse = {
      data: [{ id: '1', title: 'Book 1' }],
      meta: { total: 1, page: 1, limit: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useBooks({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toEqual([{ id: '1', title: 'Book 1' }])
    expect(result.current.data?.meta.total).toBe(1)
  })

  it('handles response with total property', async () => {
    const mockResponse = {
      items: [{ id: '1', title: 'Book 1' }],
      total: 100,
      page: 2,
      limit: 10,
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useBooks({ page: 2, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.meta.total).toBe(100)
    expect(result.current.data?.meta.page).toBe(2)
    expect(result.current.data?.meta.pageSize).toBe(10)
  })

  it('handles empty search string', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: { items: [], meta: { total: 0, page: 1, pageSize: 10 } } })

    renderHook(() => useBooks({ search: '', page: 1 }), { wrapper })

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalled()
    })

    const callArgs = mockAxios.get.mock.calls[0][1]
    expect(callArgs.params.search).toBeUndefined()
  })

  it('uses default pagination values', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: { items: [], meta: { total: 0, page: 1, pageSize: 10 } } })

    renderHook(() => useBooks({}), { wrapper })

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalled()
    })

    const callArgs = mockAxios.get.mock.calls[0][1]
    expect(callArgs.params.page).toBe(1)
    expect(callArgs.params.limit).toBe(10)
  })
})
