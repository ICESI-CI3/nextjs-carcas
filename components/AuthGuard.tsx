import { useRouter } from 'next/router'
import React, { ReactNode, useEffect } from 'react'
import { useAuthContext } from '../context/AuthContext'

type Props = {
  children: ReactNode
  requireAuth?: boolean
  roles?: string[]
  redirectTo?: string
  unauthorizedFallback?: ReactNode
  loadingFallback?: ReactNode
}

const AuthGuard: React.FC<Props> = ({
  children,
  requireAuth = true,
  roles,
  redirectTo,
  unauthorizedFallback,
  loadingFallback,
}) => {
  const router = useRouter()
  const { initializing, isAuthenticated, hasRole } = useAuthContext()

  const mustRedirectTo = redirectTo ?? '/login'
  const haveAccess = (!requireAuth || isAuthenticated) && (!roles || hasRole(roles))

  useEffect(() => {
    if (initializing) return
    if (requireAuth && !isAuthenticated) {
      // Preserve current route so we can return after login
      const searchParams = new URLSearchParams()
      searchParams.set('redirect', router.asPath)
      router.replace(`${mustRedirectTo}?${searchParams.toString()}`)
    } else if (roles && !hasRole(roles)) {
      router.replace('/403')
    }
  }, [initializing, requireAuth, isAuthenticated, roles, hasRole, router, mustRedirectTo])

  if (initializing) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
        {loadingFallback ?? 'Cargando sesión...'}
      </div>
    )
  }

  if (!haveAccess) {
    return unauthorizedFallback ?? (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
        Acceso restringido.
      </div>
    )
  }

  return <>{children}</>
}

export default AuthGuard
