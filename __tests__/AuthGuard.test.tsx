import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import AuthGuard from '../components/AuthGuard'
import { AuthProvider } from '../context/AuthContext'
import axios from '../lib/api'
import { useRouter } from 'next/router'


jest.mock('../lib/api')
jest.mock('next/router')

const mockAxios = axios as jest.Mocked<typeof axios>
const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  asPath: '/protected',
  query: {},
  route: '/protected',
  pathname: '/protected',
  isReady: true,
}

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('shows loading state while initializing', () => {
    // Set token so AuthProvider tries to fetch profile
    localStorage.setItem('token', 'test-token')
    // Mock axios to never resolve, keeping initializing state
    mockAxios.get.mockReset()
    mockAxios.get.mockImplementation(() => new Promise(() => {}))

    render(
      <TestWrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.getByText('Cargando sesión...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows custom loading fallback', () => {
    // Set token so AuthProvider tries to fetch profile
    localStorage.setItem('token', 'test-token')
    // Mock axios to never resolve, keeping initializing state
    mockAxios.get.mockReset()
    mockAxios.get.mockImplementation(() => new Promise(() => {}))

    render(
      <TestWrapper>
        <AuthGuard loadingFallback={<div>Custom Loading</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    expect(screen.getByText('Custom Loading')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated and requireAuth is true', async () => {
    mockAxios.get.mockRejectedValueOnce(new Error('Unauthorized'))

    render(
      <TestWrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login?redirect=%2Fprotected')
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('allows access when not authenticated but requireAuth is false', async () => {
    mockAxios.get.mockRejectedValueOnce(new Error('Unauthorized'))

    render(
      <TestWrapper>
        <AuthGuard requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Public Content')).toBeInTheDocument()
    })
  })

  it('allows access when authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'STUDENT',
    }

    localStorage.setItem('token', 'test-token')
    mockAxios.get.mockReset()
    mockAxios.get.mockImplementation((url: string) => {
      if (url === '/users/profile') {
        return Promise.resolve({ data: mockUser })
      }
      return Promise.reject(new Error('Unauthorized'))
    })

    render(
      <TestWrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it('redirects to 403 when user lacks required role', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'STUDENT',
    }

    localStorage.setItem('token', 'test-token')
    mockAxios.get.mockReset()
    mockAxios.get.mockImplementation((url: string) => {
      if (url === '/users/profile') {
        return Promise.resolve({ data: mockUser })
      }
      return Promise.reject(new Error('Unauthorized'))
    })

    render(
      <TestWrapper>
        <AuthGuard roles={['ADMIN']}>
          <div>Admin Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    // Wait for authentication to complete, then check for redirect
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Should redirect to /403, not /login
    expect(mockRouter.replace).toHaveBeenCalledWith('/403')
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('allows access when user has required role', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      role: 'ADMIN',
    }

    localStorage.setItem('token', 'test-token')
    mockAxios.get.mockImplementation((url: string) => {
      if (url === '/users/profile') {
        return Promise.resolve({ data: mockUser })
      }
      return Promise.reject(new Error('Unauthorized'))
    })

    render(
      <TestWrapper>
        <AuthGuard roles={['ADMIN', 'LIBRARIAN']}>
          <div>Admin Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('uses custom redirectTo path', async () => {
    mockAxios.get.mockRejectedValueOnce(new Error('Unauthorized'))

    render(
      <TestWrapper>
        <AuthGuard redirectTo="/custom-login">
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/custom-login?redirect=%2Fprotected')
    })
  })

  it('shows unauthorized fallback when access denied', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'STUDENT',
    }

    localStorage.setItem('token', 'test-token')
    mockAxios.get.mockImplementation((url: string) => {
      if (url === '/users/profile') {
        return Promise.resolve({ data: mockUser })
      }
      return Promise.reject(new Error('Unauthorized'))
    })

    render(
      <TestWrapper>
        <AuthGuard roles={['ADMIN']} unauthorizedFallback={<div>Access Denied</div>}>
          <div>Admin Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows default unauthorized message when access denied', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'STUDENT',
    }

    localStorage.setItem('token', 'test-token')
    mockAxios.get.mockImplementation((url: string) => {
      if (url === '/users/profile') {
        return Promise.resolve({ data: mockUser })
      }
      return Promise.reject(new Error('Unauthorized'))
    })

    render(
      <TestWrapper>
        <AuthGuard roles={['ADMIN']}>
          <div>Admin Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    // Wait for redirect to happen first
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalled()
    }, { timeout: 3000 })

    // After redirect, should show unauthorized message
    await waitFor(() => {
      expect(screen.getByText('Acceso restringido.')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles case-insensitive role matching', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
    }

    localStorage.setItem('token', 'test-token')
    mockAxios.get.mockImplementation((url: string) => {
      if (url === '/users/profile') {
        return Promise.resolve({ data: mockUser })
      }
      return Promise.reject(new Error('Unauthorized'))
    })

    render(
      <TestWrapper>
        <AuthGuard roles={['ADMIN']}>
          <div>Admin Content</div>
        </AuthGuard>
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
