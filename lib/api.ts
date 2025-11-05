import axios from 'axios'

const rawApi = process.env.NEXT_PUBLIC_API_URL || 'https://nest-1my6.onrender.com'
const baseURL = rawApi.endsWith('/api') ? rawApi : rawApi.replace(/\/+$/, '') + '/api'

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
})

instance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

export default instance
