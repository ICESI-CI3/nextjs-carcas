import { useRouter } from 'next/router'
import { useAuthContext } from '../context/AuthContext'

export default function useAuth(){
  const router = useRouter()
  const ctx = useAuthContext()

  async function login(payload: { email: string, password: string }){
    await ctx.login(payload)
    // redirect after successful login
    router.push('/books')
  }

  function logout(){
    ctx.logout()
    router.push('/login')
  }

  return { ...ctx, login, logout }
}
