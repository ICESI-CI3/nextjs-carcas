import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from '../lib/api'

export type User = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
  twoFactorEnabled?: boolean
}

type LoginPayload = {
  email: string
  password: string
  totp?: string
}

type RegisterPayload = {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

type AuthContextValue = {
  user: User | null
  token: string | null
  initializing: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  hasRole: (roles: string | string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let active = true
    if (typeof window === 'undefined') {
      setInitializing(false)
      return () => { active = false }
    }

    const stored = window.localStorage.getItem('token')
    if (!stored) {
      setInitializing(false)
      return () => { active = false }
    }

    setToken(stored)
    axios.get('/users/profile')
      .then(res => {
        if (active) setUser(res.data)
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        window.localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => { if (active) setInitializing(false) })

    return () => { active = false }
  }, [])

  function persistToken(value: string | null){
    if (typeof window === 'undefined') return
    if (value) window.localStorage.setItem('token', value)
    else window.localStorage.removeItem('token')
  }

  async function login({ email, password, totp }: LoginPayload){
    const endpoint = totp ? '/auth/2fa/login' : '/auth/login'
    const response = await axios.post(endpoint, { email, password, code: totp })
    const receivedToken = response.data?.access_token || response.data?.accessToken
    if (!receivedToken) throw new Error('Token no recibido del servidor')

    persistToken(receivedToken)
    setToken(receivedToken)
    const profile = await axios.get('/users/profile')
    setUser(profile.data)
  }

  async function register(payload: RegisterPayload){
    await axios.post('/auth/register', payload)
  }

  function logout(){
    persistToken(null)
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

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    initializing,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    refreshProfile,
    hasRole,
  }), [user, token, initializing])

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
