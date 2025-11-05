import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUsers } from '../hooks/useUsers'
import axios from '../lib/api'

jest.mock('../lib/api')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('useUsers - Enhanced Coverage', () => {
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

  it('handles array response format', async () => {
    const mockArray = [
      { id: '1', email: 'user1@example.com' },
      { id: '2', email: 'user2@example.com' },
      { id: '3', email: 'user3@example.com' },
      { id: '4', email: 'user4@example.com' },
    ]
    mockAxios.get.mockResolvedValueOnce({ data: mockArray })

    const { result } = renderHook(() => useUsers({ page: 2, pageSize: 2 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toHaveLength(2)
    expect(result.current.data?.items[0]).toEqual({ id: '3', email: 'user3@example.com' })
    expect(result.current.data?.meta.total).toBe(4)
  })

  it('handles response with data property', async () => {
    const mockResponse = {
      data: [{ id: '1', email: 'user1@example.com' }],
      meta: { total: 1, page: 1, limit: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useUsers({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toEqual([{ id: '1', email: 'user1@example.com' }])
  })

  it('handles search parameter', async () => {
    const mockResponse = {
      items: [{ id: '1', email: 'test@example.com' }],
      meta: { total: 1, page: 1, pageSize: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useUsers({ search: 'test', page: 1 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockAxios.get).toHaveBeenCalledWith('/users', {
      params: { search: 'test', q: 'test', page: 1, limit: 10 },
    })
  })

  it('trims search parameter', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: { items: [], meta: { total: 0, page: 1, pageSize: 10 } } })

    renderHook(() => useUsers({ search: '  spaced  ', page: 1 }), { wrapper })

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalled()
    })

    const callArgs = mockAxios.get.mock.calls[0][1]
    expect(callArgs.params.search).toBe('spaced')
    expect(callArgs.params.q).toBe('spaced')
  })

  it('handles response with missing total and page', async () => {
    const mockResponse = {
      items: [{ id: '1', email: 'user1@example.com' }],
      meta: { pageSize: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useUsers({ page: 2, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.meta.total).toBe(1) // Falls back to items length
    expect(result.current.data?.meta.page).toBe(2) // Uses provided page
  })

  it('handles response with items property', async () => {
    const mockResponse = {
      items: [{ id: '1', email: 'user1@example.com' }],
      total: 1,
      page: 1,
      limit: 10,
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useUsers({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toEqual([{ id: '1', email: 'user1@example.com' }])
    expect(result.current.data?.meta.total).toBe(1)
  })

  it('handles empty search parameter', async () => {
    mockAxios.get.mockResolvedValueOnce({ data: { items: [], meta: { total: 0, page: 1, pageSize: 10 } } })

    renderHook(() => useUsers({ search: '', page: 1 }), { wrapper })

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalled()
    })

    const callArgs = mockAxios.get.mock.calls[0][1]
    expect(callArgs.params.search).toBeUndefined()
    expect(callArgs.params.q).toBeUndefined()
  })

  it('handles response with data.items fallback', async () => {
    const mockResponse = {
      data: [{ id: '1', email: 'user1@example.com' }],
      // No items property
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useUsers({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toEqual([{ id: '1', email: 'user1@example.com' }])
  })
})
