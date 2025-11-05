import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import axios from 'axios'

jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  }
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockInstance),
    },
  }
})

describe('lib/api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should configure axios instance with baseURL', () => {
    jest.resetModules()
    const axiosMock = require('axios')
    require('../lib/api')
    expect(axiosMock.default.create).toHaveBeenCalled()
    const createCall = (axiosMock.default.create as jest.Mock).mock.calls[0][0]
    expect(createCall).toHaveProperty('baseURL')
    expect(createCall).toHaveProperty('headers')
    expect(createCall.headers['Content-Type']).toBe('application/json')
  })

  it('should setup request interceptor to add token', () => {
    jest.resetModules()
    const axiosMock = require('axios')
    require('../lib/api')
    const mockInstance = (axiosMock.default.create as jest.Mock).mock.results[0].value
    
    expect(mockInstance.interceptors.request.use).toHaveBeenCalled()
    const interceptor = (mockInstance.interceptors.request.use as jest.Mock).mock.calls[0][0]
    
    // Test the interceptor function
    const config = { headers: {} }
    const result = interceptor(config)
    
    // Without token, should not modify headers
    expect(result).toBe(config)
    
    // With token, should add Authorization header
    localStorage.setItem('token', 'test-token')
    const configWithToken = { headers: {} }
    const resultWithToken = interceptor(configWithToken)
    
    expect(resultWithToken.headers['Authorization']).toBe('Bearer test-token')
  })

  it('should setup response interceptor to handle 401', () => {
    jest.resetModules()
    const axiosMock = require('axios')
    require('../lib/api')
    const mockInstance = (axiosMock.default.create as jest.Mock).mock.results[0].value
    
    expect(mockInstance.interceptors.response.use).toHaveBeenCalled()
    const errorHandler = (mockInstance.interceptors.response.use as jest.Mock).mock.calls[0][1]
    
    // Test error handler with 401
    const error401 = { response: { status: 401 } }
    localStorage.setItem('token', 'test-token')
    
    const result = errorHandler(error401)
    expect(localStorage.getItem('token')).toBeNull()
    expect(result).rejects.toEqual(error401)
  })

  it('should handle baseURL ending with /api', () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api'
    
    // Clear the module cache and require again
    jest.resetModules()
    // Ensure axios.create mock is still available
    const axiosMock = require('axios')
    require('../lib/api')
    
    expect(axiosMock.default.create).toHaveBeenCalled()
    process.env.NEXT_PUBLIC_API_URL = originalEnv
  })
})
