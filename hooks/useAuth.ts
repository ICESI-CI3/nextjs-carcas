import { useRouter } from 'next/router'
import { useAuthContext } from '../context/AuthContext'

type LoginOptions = {
  redirectTo?: string
}

type LogoutOptions = {
  redirectTo?: string
}

export default function useAuth(){
  const router = useRouter()
  const ctx = useAuthContext()

  async function login(payload: { email: string, password: string, totp?: string }, options?: LoginOptions){
    await ctx.login(payload)
    if (options?.redirectTo) router.push(options.redirectTo)
  }

  function logout(options?: LogoutOptions){
    ctx.logout()
    const destination = options?.redirectTo ?? '/login'
    router.push(destination)
  }

  return { ...ctx, login, logout }
}
