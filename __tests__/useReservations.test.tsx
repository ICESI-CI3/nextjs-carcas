import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import '@testing-library/jest-dom'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useMyReservations,
  usePendingReservations,
  useAllReservations,
} from '../hooks/useReservations'
import axios from '../lib/api'


jest.mock('../lib/api')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('useReservations', () => {
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

  describe('useMyReservations', () => {
    it('fetches user reservations', async () => {
      const mockReservations = [
        {
          id: '1',
          status: 'pending',
          createdAt: '2024-01-01',
          copy: { id: '1', book: { id: '1', title: 'Book 1' } },
        },
      ]
      mockAxios.get.mockResolvedValueOnce({ data: mockReservations })

      const { result } = renderHook(() => useMyReservations(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockReservations)
      expect(mockAxios.get).toHaveBeenCalledWith('/reservations/my')
    })
  })

  describe('usePendingReservations', () => {
    it('fetches pending reservations when enabled', async () => {
      const mockReservations = [
        {
          id: '1',
          status: 'pending',
          createdAt: '2024-01-01',
          copy: { id: '1', book: { id: '1', title: 'Book 1' } },
        },
      ]
      mockAxios.get.mockResolvedValueOnce({ data: mockReservations })

      const { result } = renderHook(() => usePendingReservations(true), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockReservations)
      expect(mockAxios.get).toHaveBeenCalledWith('/reservations/pending')
    })

    it('does not fetch when disabled', () => {
      renderHook(() => usePendingReservations(false), { wrapper })

      expect(mockAxios.get).not.toHaveBeenCalled()
    })
  })

  describe('useAllReservations', () => {
    it('fetches all reservations when enabled', async () => {
      const mockReservations = [
        {
          id: '1',
          status: 'fulfilled',
          createdAt: '2024-01-01',
          user: { id: '1', email: 'user@example.com' },
        },
      ]
      mockAxios.get.mockResolvedValueOnce({ data: mockReservations })

      const { result } = renderHook(() => useAllReservations(true), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockReservations)
      expect(mockAxios.get).toHaveBeenCalledWith('/reservations')
    })

    it('does not fetch when disabled', () => {
      renderHook(() => useAllReservations(false), { wrapper })

      expect(mockAxios.get).not.toHaveBeenCalled()
    })
  })
})
