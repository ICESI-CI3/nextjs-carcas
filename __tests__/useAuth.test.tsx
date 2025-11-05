import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import '@testing-library/jest-dom'
import { renderHook, act, waitFor } from '@testing-library/react'
import useAuth from '../hooks/useAuth'
import { AuthProvider } from '../context/AuthContext'
import axios from '../lib/api'
import { useRouter } from 'next/router'


jest.mock('../lib/api')
jest.mock('next/router')

const mockAxios = axios as jest.Mocked<typeof axios>
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  asPath: '/',
  query: {},
  route: '/',
  pathname: '/',
  isReady: true,
}

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('login redirects when redirectTo option is provided', async () => {
    const mockUser = { id: '1', email: 'test@example.com', role: 'STUDENT' }
    mockAxios.post.mockResolvedValueOnce({ data: { access_token: 'token' } })
    mockAxios.get.mockResolvedValueOnce({ data: mockUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    await act(async () => {
      await result.current.login(
        { email: 'test@example.com', password: 'password' },
        { redirectTo: '/books' }
      )
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/books')
    })
  })

  it('login does not redirect when redirectTo is not provided', async () => {
    const mockUser = { id: '1', email: 'test@example.com', role: 'STUDENT' }
    mockAxios.post.mockResolvedValueOnce({ data: { access_token: 'token' } })
    mockAxios.get.mockResolvedValueOnce({ data: mockUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' })
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('logout redirects to default login page', async () => {
    const mockUser = { id: '1', email: 'test@example.com', role: 'STUDENT' }
    localStorage.setItem('token', 'test-token')
    mockAxios.get.mockResolvedValueOnce({ data: mockUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    act(() => {
      result.current.logout()
    })

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('logout redirects to custom destination', async () => {
    const mockUser = { id: '1', email: 'test@example.com', role: 'STUDENT' }
    localStorage.setItem('token', 'test-token')
    mockAxios.get.mockResolvedValueOnce({ data: mockUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    act(() => {
      result.current.logout({ redirectTo: '/custom-logout' })
    })

    expect(mockPush).toHaveBeenCalledWith('/custom-logout')
  })

  it('exposes all context values', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('token')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('login')
    expect(result.current).toHaveProperty('logout')
    expect(result.current).toHaveProperty('register')
    expect(result.current).toHaveProperty('hasRole')
    expect(result.current).toHaveProperty('refreshProfile')
  })
})
