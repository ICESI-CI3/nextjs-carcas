import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuthContext, User } from '../context/AuthContext'
import axios from '../lib/api'
import React from 'react'


jest.mock('../lib/api')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('AuthContext', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockAxios.get.mockReset()
    mockAxios.post.mockReset()
  })

  describe('useAuthContext', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => {
        renderHook(() => useAuthContext())
      }).toThrow('useAuthContext must be used within AuthProvider')
      consoleError.mockRestore()
    })
  })

  describe('AuthProvider', () => {
    it('initializes with no token', async () => {
      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.token).toBe(null)
    })

    it('initializes with token and loads user profile', async () => {
      localStorage.setItem('token', 'test-token')
      mockAxios.get.mockResolvedValueOnce({ data: mockUser })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      expect(result.current.token).toBe('test-token')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(mockAxios.get).toHaveBeenCalledWith('/users/profile')
    })

    it('handles invalid token on initialization', async () => {
      localStorage.setItem('token', 'invalid-token')
      mockAxios.get.mockRejectedValueOnce(new Error('Unauthorized'))

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      expect(result.current.token).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
      expect(localStorage.getItem('token')).toBe(null)
    })

    it('login successfully without TOTP', async () => {
      const loginResponse = { data: { access_token: 'new-token' } }
      mockAxios.post.mockResolvedValueOnce(loginResponse)
      mockAxios.get.mockResolvedValueOnce({ data: mockUser })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.current.token).toBe('new-token')
      expect(result.current.user).toEqual(mockUser)
      expect(localStorage.getItem('token')).toBe('new-token')
    })

    it('login successfully with TOTP', async () => {
      const loginResponse = { data: { access_token: 'new-token' } }
      mockAxios.post.mockResolvedValueOnce(loginResponse)
      mockAxios.get.mockResolvedValueOnce({ data: mockUser })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
          totp: '123456',
        })
      })

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/2fa/login', {
        email: 'test@example.com',
        password: 'password123',
        code: '123456',
      })
      expect(result.current.token).toBe('new-token')
    })

    it('login handles accessToken format', async () => {
      const loginResponse = { data: { accessToken: 'alt-token' } }
      mockAxios.post.mockResolvedValueOnce(loginResponse)
      mockAxios.get.mockResolvedValueOnce({ data: mockUser })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(result.current.token).toBe('alt-token')
    })

    it('login throws error when no token received', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: {} })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'password123',
          })
        })
      ).rejects.toThrow('Token no recibido del servidor')
    })

    it('register successfully', async () => {
      mockAxios.post.mockResolvedValueOnce({ data: { success: true } })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        })
      })

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/register', {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })
    })

    it('logout clears state and token', async () => {
      localStorage.setItem('token', 'test-token')
      mockAxios.get.mockResolvedValueOnce({ data: mockUser })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.token).toBe(null)
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorage.getItem('token')).toBe(null)
    })

    it('refreshProfile updates user data', async () => {
      const updatedUser = { ...mockUser, firstName: 'Updated' }
      localStorage.setItem('token', 'test-token')
      mockAxios.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: updatedUser })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      await act(async () => {
        await result.current.refreshProfile()
      })

      expect(result.current.user).toEqual(updatedUser)
      expect(mockAxios.get).toHaveBeenCalledTimes(2)
    })

    it('hasRole returns true for matching single role', async () => {
      localStorage.setItem('token', 'test-token')
      mockAxios.get.mockResolvedValueOnce({ data: { ...mockUser, role: 'ADMIN' } })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      expect(result.current.hasRole('ADMIN')).toBe(true)
      expect(result.current.hasRole('admin')).toBe(true)
      expect(result.current.hasRole('STUDENT')).toBe(false)
    })

    it('hasRole returns true for matching role in array', async () => {
      localStorage.setItem('token', 'test-token')
      mockAxios.get.mockResolvedValueOnce({ data: { ...mockUser, role: 'LIBRARIAN' } })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      expect(result.current.hasRole(['ADMIN', 'LIBRARIAN'])).toBe(true)
      expect(result.current.hasRole(['ADMIN', 'STUDENT'])).toBe(false)
      expect(result.current.hasRole(['admin', 'librarian'])).toBe(true)
    })

    it('hasRole returns false when user has no role', async () => {
      localStorage.setItem('token', 'test-token')
      mockAxios.get.mockResolvedValueOnce({ data: { ...mockUser, role: undefined } })

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.initializing).toBe(false)
      })

      expect(result.current.hasRole('ADMIN')).toBe(false)
      expect(result.current.hasRole(['ADMIN', 'STUDENT'])).toBe(false)
    })

    it('hasRole returns false when user is null', () => {
      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      expect(result.current.user).toBe(null)
      expect(result.current.hasRole('ADMIN')).toBe(false)
    })

    it('handles SSR environment (no window)', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      })

      expect(result.current.initializing).toBe(false)

      global.window = originalWindow
    })
  })
})
