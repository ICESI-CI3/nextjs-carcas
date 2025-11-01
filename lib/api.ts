import axios from 'axios'

// Construir baseURL asegurando que termine en /api
const rawApi = process.env.NEXT_PUBLIC_API_URL || 'https://nest-1my6.onrender.com'
const baseURL = rawApi.endsWith('/api') ? rawApi : rawApi.replace(/\/+$/, '') + '/api'

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Si en el futuro pasas a cookies httpOnly, habilitar withCredentials
  // withCredentials: true,
})

// Attach token from localStorage (note: localStorage accessible only client-side)
instance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

export default instance
