import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from '../lib/api'

type User = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
}

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (payload: { email: string; password: string }) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  hasRole: (roles: string | string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Init from localStorage on client
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('token')
      if (t) {
        setToken(t)
        // try to fetch profile
        axios.get('/users/profile')
          .then(res => setUser(res.data))
          .catch(() => {
            // token maybe invalid
            setUser(null)
            localStorage.removeItem('token')
            setToken(null)
          })
      }
    }
  }, [])

  async function login({ email, password }: { email: string; password: string }){
    const resp = await axios.post('/auth/login', { email, password })
    const t = resp.data?.access_token
    if(!t) throw new Error('Token no recibido')
    if (typeof window !== 'undefined') localStorage.setItem('token', t)
    setToken(t)
    // fetch profile
    const profile = await axios.get('/users/profile')
    setUser(profile.data)
  }

  function logout(){
    if (typeof window !== 'undefined') localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  async function refreshProfile(){
    const profile = await axios.get('/users/profile')
    setUser(profile.data)
  }

  function hasRole(roles: string | string[]){
    if(!user?.role) return false
    const userRole = String(user.role).toUpperCase()
    if (typeof roles === 'string') return userRole === roles.toUpperCase()
    return roles.map(r => r.toUpperCase()).includes(userRole)
  }

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    refreshProfile,
    hasRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(){
  const ctx = useContext(AuthContext)
  if(!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

export default AuthContext
