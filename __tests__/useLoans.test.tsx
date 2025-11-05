import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import '@testing-library/jest-dom'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyLoans, useAllLoans } from '../hooks/useLoans'
import axios from '../lib/api'


jest.mock('../lib/api')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('useLoans', () => {
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

  describe('useMyLoans', () => {
    it('fetches user loans', async () => {
      const mockLoans = [
        {
          id: '1',
          status: 'active',
          borrowedAt: '2024-01-01',
          copy: { id: '1', book: { id: '1', title: 'Book 1' } },
        },
      ]
      mockAxios.get.mockResolvedValueOnce({ data: mockLoans })

      const { result } = renderHook(() => useMyLoans(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockLoans)
      expect(mockAxios.get).toHaveBeenCalledWith('/loans/my')
    })

    it('handles empty loans list', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: [] })

      const { result } = renderHook(() => useMyLoans(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })
  })

  describe('useAllLoans', () => {
    it('fetches all loans when enabled', async () => {
      const mockLoans = [
        {
          id: '1',
          status: 'active',
          borrowedAt: '2024-01-01',
          user: { id: '1', email: 'user@example.com' },
        },
      ]
      mockAxios.get.mockResolvedValueOnce({ data: mockLoans })

      const { result } = renderHook(() => useAllLoans(true), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockLoans)
      expect(mockAxios.get).toHaveBeenCalledWith('/loans')
    })

    it('does not fetch when disabled', () => {
      renderHook(() => useAllLoans(false), { wrapper })

      expect(mockAxios.get).not.toHaveBeenCalled()
    })
  })
})
