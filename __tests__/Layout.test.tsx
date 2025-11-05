import { describe, it, expect } from '@jest/globals'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Layout from '../components/Layout'
import { AuthProvider } from '../context/AuthContext'
import axios from '../lib/api'

jest.mock('../lib/api')

const mockAxios = axios as jest.Mocked<typeof axios>

describe('Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAxios.get.mockRejectedValueOnce(new Error('Unauthorized'))
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('renders children', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>,
      { wrapper }
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders Header component', async () => {
    render(
      <Layout>
        <div>Test</div>
      </Layout>,
      { wrapper }
    )

    // Header should be present (it renders BiblioIcesi)
    expect(screen.getByText('BiblioIcesi')).toBeInTheDocument()
  })
})
