import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import '@testing-library/jest-dom'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUsers } from '../hooks/useUsers'
import axios from '../lib/api'


jest.mock('../lib/api')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('useUsers', () => {
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

  it('fetches users with pagination', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', role: 'STUDENT' },
      { id: '2', email: 'user2@example.com', role: 'ADMIN' },
    ]
    const mockResponse = {
      items: mockUsers,
      meta: { total: 2, page: 1, pageSize: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useUsers({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(mockAxios.get).toHaveBeenCalledWith('/users', {
      params: { page: 1, limit: 10 },
    })
  })

  it('handles different page sizes', async () => {
    const mockResponse = {
      items: [],
      meta: { total: 0, page: 2, pageSize: 20 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useUsers({ page: 2, pageSize: 20 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockAxios.get).toHaveBeenCalledWith('/users', {
      params: { page: 2, limit: 20 },
    })
  })

  it('handles empty users list', async () => {
    const mockResponse = {
      items: [],
      meta: { total: 0, page: 1, pageSize: 10 },
    }
    mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

    const { result } = renderHook(() => useUsers({ page: 1, pageSize: 10 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toEqual([])
    expect(result.current.data?.meta.total).toBe(0)
  })
})
