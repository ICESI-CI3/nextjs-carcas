import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBooks } from '../hooks/useBooks'
import axios from '../lib/api'

jest.mock('../lib/api')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('useBooks - Enhanced Coverage', () => {
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

  it('handles response with missing meta fields', async () => {
    const mockResponse = {
      items: [{ id: '1', title: 'Book 1' }],
      // No meta object
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useBooks({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toEqual([{ id: '1', title: 'Book 1' }])
    expect(result.current.data?.meta.total).toBe(1) // Falls back to items length
    expect(result.current.data?.meta.page).toBe(1) // Falls back to provided page
  })

  it('handles response with limit instead of pageSize', async () => {
    const mockResponse = {
      items: [{ id: '1', title: 'Book 1' }],
      meta: { total: 1, page: 1, limit: 20 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useBooks({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.meta.pageSize).toBe(20) // Uses limit
  })

  it('handles zero total items', async () => {
    const mockResponse = {
      items: [],
      meta: { total: 0, page: 1, pageSize: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useBooks({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toEqual([])
    expect(result.current.data?.meta.total).toBe(0)
  })
})
