# Informe de Funcionalidades Implementadas

## BiblioIcesi Frontend - Aplicación de Gestión de Biblioteca

**Proyecto**: Frontend Next.js para Sistema de Gestión de Biblioteca  
**Tecnologías**: Next.js 13, React 18, TypeScript, Tailwind CSS  
**Estado de API**: Consumiendo API REST desarrollada en NestJS

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Autenticación](#autenticación)
4. [Autorización](#autorización)
5. [Gestión del Estado](#gestión-del-estado)
6. [Arquitectura y Componentes](#arquitectura-y-componentes)
7. [Conclusión](#conclusión)

---

## Resumen Ejecutivo

BiblioIcesi Frontend es una aplicación web desarrollada con Next.js que proporciona una interfaz completa para la gestión de una biblioteca universitaria. La aplicación permite a diferentes tipos de usuarios (estudiantes, bibliotecarios y administradores) interactuar con el catálogo de libros, gestionar reservas y préstamos, y realizar operaciones administrativas según su rol.

### Características Principales

- Sistema de autenticación JWT con soporte para 2FA
- Autorización basada en roles (ADMIN, LIBRARIAN, STUDENT)
- Gestión de catálogo de libros con búsqueda y paginación
- Sistema de reservas y préstamos
- Panel administrativo para gestión de usuarios y préstamos
- Interfaz responsive y moderna con Tailwind CSS
- Cobertura de pruebas superior al 80%

---

## Funcionalidades Implementadas

### 1. Catálogo de Libros

#### 1.1 Listado de Libros
- **Ubicación**: `/pages/books/index.tsx`
- **Funcionalidad**:
  - Visualización paginada del catálogo completo
  - Búsqueda en tiempo real con debounce (400ms)
  - Filtrado por título, autor o ISBN
  - Navegación por páginas con componente `Pagination`
  - Sincronización de búsqueda con URL (query parameters)
  - Estado de carga y manejo de errores

#### 1.2 Detalle de Libro
- **Ubicación**: `/pages/books/[id].tsx`
- **Funcionalidad**:
  - Visualización completa de información del libro
  - Listado de copias disponibles
  - Botones de acción según rol del usuario:
    - **Estudiantes**: Reservar libro
    - **Bibliotecarios/Admin**: Crear préstamo, ver historial

#### 1.3 Creación y Edición de Libros
- **Ubicación**: `/pages/books/create.tsx`, `/pages/books/[id]/edit.tsx`
- **Funcionalidad**:
  - Formularios para crear y editar libros
  - Integración con Google Books API para enriquecimiento de datos
  - Validación de campos requeridos
  - Acceso restringido a roles ADMIN y LIBRARIAN

### 2. Sistema de Reservas

#### 2.1 Mis Reservas
- **Ubicación**: `/pages/my/reservations.tsx`
- **Funcionalidad**:
  - Listado de reservas del usuario autenticado
  - Estados de reserva: pendiente, confirmada, expirada, cancelada
  - Cancelación de reservas activas
  - Visualización de fecha de expiración
  - Información de la copia reservada

#### 2.2 Creación de Reservas
- **Funcionalidad**:
  - Creación desde la página de detalle del libro
  - Validación de disponibilidad
  - Notificaciones de éxito/error
  - Actualización automática del estado

### 3. Sistema de Préstamos

#### 3.1 Mis Préstamos
- **Ubicación**: `/pages/my/loans.tsx`
- **Funcionalidad**:
  - Listado de préstamos activos del usuario
  - Visualización de fechas de préstamo y devolución
  - Estado de multas (si aplica)
  - Información del libro prestado

#### 3.2 Gestión de Préstamos (Admin/Bibliotecario)
- **Funcionalidad**:
  - Visualización de todos los préstamos del sistema
  - Registro de nuevos préstamos
  - Registro de devoluciones
  - Cálculo automático de multas
  - Filtrado por estado y usuario

### 4. Panel Administrativo

- **Ubicación**: `/pages/admin/index.tsx`
- **Funcionalidad**:
  - Dashboard con estadísticas generales
  - Gestión de usuarios
  - Visualización de reservas pendientes
  - Gestión de préstamos activos
  - Acceso exclusivo para ADMIN y LIBRARIAN

### 5. Autenticación y Registro

#### 5.1 Login
- **Ubicación**: `/pages/login.tsx`
- **Funcionalidad**:
  - Autenticación con email y contraseña
  - Soporte para autenticación de dos factores (2FA/TOTP)
  - Redirección después del login
  - Manejo de errores y mensajes informativos
  - Persistencia de sesión

#### 5.2 Registro
- **Ubicación**: `/pages/register.tsx`
- **Funcionalidad**:
  - Creación de nuevas cuentas de usuario
  - Validación de formulario
  - Redirección a login después del registro

### 6. Interfaz de Usuario

#### 6.1 Navegación
- **Componente**: `Header.tsx`
- **Funcionalidad**:
  - Navegación contextual según estado de autenticación
  - Enlaces específicos por rol
  - Visualización de información del usuario
  - Botón de logout

#### 6.2 Layout
- **Componente**: `Layout.tsx`
- **Funcionalidad**:
  - Estructura consistente en todas las páginas
  - Integración del Header
  - Área de contenido principal

---

## Autenticación

### Implementación

La autenticación se implementa utilizando **JWT (JSON Web Tokens)** con persistencia en el cliente mediante `localStorage` y un sistema de contexto React para gestionar el estado de autenticación globalmente.

### Arquitectura de Autenticación

#### 1. Context API (`context/AuthContext.tsx`)

El `AuthProvider` es el núcleo del sistema de autenticación:

```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  // ...
}
```

**Características principales**:

- **Estado centralizado**: Gestiona `user`, `token` e `initializing`
- **Inicialización automática**: Verifica si existe un token en `localStorage` al cargar la aplicación
- **Validación de sesión**: Consulta `/users/profile` para validar el token y obtener datos del usuario
- **Limpieza automática**: Elimina tokens inválidos o expirados

#### 2. Flujo de Autenticación

##### 2.1 Login

```typescript
async function login({ email, password, totp }: LoginPayload){
  const endpoint = totp ? '/auth/2fa/login' : '/auth/login'
  const response = await axios.post(endpoint, { email, password, code: totp })
  const receivedToken = response.data?.access_token || response.data?.accessToken
  
  persistToken(receivedToken)
  setToken(receivedToken)
  const profile = await axios.get('/users/profile')
  setUser(profile.data)
}
```

**Proceso**:
1. El usuario envía credenciales (y opcionalmente código TOTP)
2. El servidor valida y retorna un JWT
3. El token se persiste en `localStorage`
4. Se actualiza el estado con el token
5. Se obtiene el perfil del usuario para actualizar el estado

##### 2.2 Soporte para 2FA

La aplicación soporta autenticación de dos factores mediante códigos TOTP:

- Si el usuario tiene 2FA habilitado, se usa el endpoint `/auth/2fa/login`
- El código TOTP se envía como parámetro `code` en el payload
- El flujo es transparente para el usuario final

##### 2.3 Persistencia de Sesión

```typescript
function persistToken(value: string | null){
  if (typeof window === 'undefined') return
  if (value) window.localStorage.setItem('token', value)
  else window.localStorage.removeItem('token')
}
```

- Los tokens se almacenan en `localStorage` del navegador
- Se mantienen entre sesiones del navegador
- Se eliminan automáticamente al hacer logout o cuando el token expira

##### 2.4 Inicialización Automática

```typescript
useEffect(() => {
  const stored = window.localStorage.getItem('token')
  if (!stored) {
    setInitializing(false)
    return
  }
  
  setToken(stored)
  axios.get('/users/profile')
    .then(res => setUser(res.data))
    .catch(() => {
      // Token inválido, limpiar
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    })
    .finally(() => setInitializing(false))
}, [])
```

**Proceso de inicialización**:
1. Al cargar la aplicación, verifica si existe un token en `localStorage`
2. Si existe, intenta validarlo consultando el perfil del usuario
3. Si la validación falla (token expirado/inválido), limpia el estado
4. Marca `initializing` como `false` cuando termina el proceso

#### 3. Interceptor de Axios (`lib/api.ts`)

El interceptor de solicitudes agrega automáticamente el token a todas las peticiones:

```typescript
instance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})
```

**Ventajas**:
- Transparente: no es necesario agregar el token manualmente en cada petición
- Centralizado: toda la lógica de autenticación está en un solo lugar
- Automático: se actualiza cuando cambia el token

#### 4. Manejo de Errores 401

El interceptor de respuestas maneja automáticamente los errores de autenticación:

```typescript
instance.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)
```

**Comportamiento**:
- Si una petición retorna 401 (No autorizado), se elimina el token
- Esto fuerza al usuario a autenticarse nuevamente
- Previene peticiones fallidas repetidas con tokens inválidos

#### 5. Hook Personalizado (`hooks/useAuth.ts`)

El hook `useAuth` encapsula la lógica de autenticación y añade funcionalidad de navegación:

```typescript
export default function useAuth(){
  const router = useRouter()
  const ctx = useAuthContext()
  
  async function login(payload, options?) {
    await ctx.login(payload)
    if (options?.redirectTo) router.push(options.redirectTo)
  }
  
  function logout(options?) {
    ctx.logout()
    router.push(options?.redirectTo ?? '/login')
  }
  
  return { ...ctx, login, logout }
}
```

**Ventajas**:
- Interfaz simplificada para componentes
- Integración automática con Next.js Router
- Redirección automática después de login/logout

---

## Autorización

### Implementación

La autorización se implementa mediante un sistema basado en **roles** que controla el acceso a rutas y funcionalidades según el tipo de usuario.

### Roles del Sistema

1. **ADMIN**: Acceso completo al sistema
2. **LIBRARIAN**: Gestión de préstamos y reservas
3. **STUDENT**: Acceso básico para consultar y reservar libros

### Componentes de Autorización

#### 1. Componente AuthGuard (`components/AuthGuard.tsx`)

El `AuthGuard` es el componente principal para proteger rutas:

```typescript
const AuthGuard: React.FC<Props> = ({
  children,
  requireAuth = true,
  roles,
  redirectTo,
  unauthorizedFallback,
  loadingFallback,
}) => {
  const { initializing, isAuthenticated, hasRole } = useAuthContext()
  
  const haveAccess = (!requireAuth || isAuthenticated) && 
                     (!roles || hasRole(roles))
  
  // Redirección y renderizado condicional
}
```

**Características**:

##### 1.1 Protección de Rutas

```typescript
useEffect(() => {
  if (initializing) return
  
  if (requireAuth && !isAuthenticated) {
    router.replace(`${redirectTo}?redirect=${router.asPath}`)
  } else if (roles && !hasRole(roles)) {
    router.replace('/403')
  }
}, [initializing, requireAuth, isAuthenticated, roles, hasRole])
```

**Comportamiento**:
- Si `requireAuth` es `true` y el usuario no está autenticado → redirige a login
- Si se especifican `roles` y el usuario no los tiene → redirige a `/403`
- Preserva la URL original para redirección después del login

##### 1.2 Estados de Carga

```typescript
if (initializing) {
  return loadingFallback ?? <div>Cargando sesión...</div>
}
```

Muestra un estado de carga mientras se verifica la autenticación.

##### 1.3 Fallbacks Personalizados

```typescript
if (!haveAccess) {
  return unauthorizedFallback ?? <div>Acceso restringido.</div>
}
```

Permite personalizar el mensaje mostrado cuando se deniega el acceso.

##### 1.4 Uso en Páginas

```typescript
// Ejemplo: Página solo para administradores
<AuthGuard roles={['ADMIN']}>
  <AdminPanel />
</AuthGuard>

// Ejemplo: Página pública pero con funcionalidades extra para autenticados
<AuthGuard requireAuth={false}>
  <PublicPage />
</AuthGuard>
```

#### 2. Función hasRole (`context/AuthContext.tsx`)

La función `hasRole` verifica si el usuario tiene los roles requeridos:

```typescript
function hasRole(roles: string | string[]){
  if(!user?.role) return false
  const userRole = String(user.role).toUpperCase()
  if (typeof roles === 'string') {
    return userRole === roles.toUpperCase()
  }
  return roles.map(r => r.toUpperCase()).includes(userRole)
}
```

**Características**:
- Soporta verificación de un solo rol o múltiples roles
- Comparación case-insensitive (insensible a mayúsculas/minúsculas)
- Retorna `false` si el usuario no tiene rol asignado

#### 3. Autorización en Componentes

##### 3.1 Navegación Condicional (`components/Header.tsx`)

```typescript
{isAuthenticated && (
  <>
    <Link href="/my/reservations">Mis reservas</Link>
    <Link href="/my/loans">Mis préstamos</Link>
  </>
)}

{hasRole(['ADMIN', 'LIBRARIAN']) && (
  <Link href="/admin">Panel</Link>
)}
```

**Implementación**:
- Los enlaces se muestran/ocultan según el estado de autenticación
- El panel administrativo solo aparece para ADMIN y LIBRARIAN
- La información del usuario se muestra solo cuando está autenticado

##### 3.2 Botones de Acción Condicionales

```typescript
// En páginas de libros
const canCreate = hasRole(['ADMIN', 'LIBRARIAN'])

{canCreate && (
  <Link href="/books/create">
    Crear Libro
  </Link>
)}
```

Los botones de crear/editar solo aparecen para usuarios autorizados.

#### 4. Página de Error 403 (`pages/403.tsx`)

Página dedicada para usuarios que intentan acceder a recursos sin permisos:

- Mensaje claro explicando la restricción
- Enlaces para volver al inicio o login
- Diseño consistente con el resto de la aplicación

---

## Gestión del Estado

La aplicación utiliza una estrategia híbrida para la gestión del estado, combinando **Context API** para el estado de autenticación y **React Query** para los datos remotos.

### Arquitectura de Estado

#### 1. Context API para Autenticación

**Ubicación**: `context/AuthContext.tsx`

**Propósito**: Gestionar el estado de autenticación de forma global y centralizada.

**Estado gestionado**:
```typescript
const [user, setUser] = useState<User | null>(null)
const [token, setToken] = useState<string | null>(null)
const [initializing, setInitializing] = useState(true)
```

**Ventajas**:
- Estado global accesible desde cualquier componente
- Actualización reactiva cuando cambia la autenticación
- Evita prop drilling (pasar props por múltiples niveles)
- Memoización con `useMemo` para optimizar rendimiento

**Uso**:
```typescript
// En cualquier componente
const { user, isAuthenticated, hasRole } = useAuth()
```

#### 2. React Query para Datos Remotos

**Propósito**: Gestionar el estado de datos obtenidos del servidor (cache, sincronización, actualización).

**Configuración** (`pages/_app.tsx`):
```typescript
const [queryClient] = useState(() => new QueryClient())

return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      {/* App */}
    </AuthProvider>
  </QueryClientProvider>
)
```

**Hooks personalizados que usan React Query**:

##### 2.1 useBooks (`hooks/useBooks.ts`)

```typescript
export function useBooks({ search, page = 1, pageSize = 10 }: BooksQuery){
  return useQuery<BooksResponse>({
    queryKey: ['books', { search, page, pageSize }],
    placeholderData: previousData => previousData,
    queryFn: async () => {
      // Fetch data
    },
  })
}
```

**Características**:
- Cache automático de resultados
- `placeholderData`: Mantiene datos anteriores mientras carga nuevos
- Invalidación automática cuando cambian los parámetros
- Manejo de estados: `isLoading`, `isFetching`, `error`

##### 2.2 useMyReservations (`hooks/useReservations.ts`)

```typescript
export function useMyReservations(){
  return useQuery<Reservation[]>({
    queryKey: ['my-reservations'],
    queryFn: async () => {
      const { data } = await axios.get('/reservations/my')
      return data
    },
    staleTime: 30_000, // 30 segundos
  })
}
```

**Características**:
- `staleTime`: Define cuándo los datos se consideran obsoletos
- Refetch automático cuando el componente se monta
- Cache compartido entre componentes que usan la misma query

##### 2.3 useAllLoans (`hooks/useLoans.ts`)

```typescript
export function useAllLoans(enabled: boolean){
  return useQuery<Loan[]>({
    queryKey: ['loans', 'all'],
    queryFn: async () => {
      const { data } = await axios.get('/loans')
      return data
    },
    enabled, // Solo se ejecuta si enabled es true
    staleTime: 15_000,
  })
}
```

**Características**:
- `enabled`: Controla si la query se ejecuta o no
- Útil para queries que solo deben ejecutarse bajo ciertas condiciones
- Permite habilitar/deshabilitar queries dinámicamente

#### 3. Hook useDebounce (`hooks/useDebounce.ts`)

Gestiona el estado de valores con debounce para optimizar búsquedas:

```typescript
export default function useDebounce<T>(value: T, delay = 400){
  const [debounced, setDebounced] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debounced
}
```

**Uso en búsqueda de libros**:
```typescript
const [searchValue, setSearchValue] = useState('')
const debouncedSearch = useDebounce(searchValue, 400)

// Solo se ejecuta la búsqueda después de 400ms sin cambios
const { data } = useBooks({ search: debouncedSearch })
```

**Ventajas**:
- Reduce el número de peticiones al servidor
- Mejora la experiencia del usuario
- Evita búsquedas en cada tecla presionada

### Flujo de Datos

```
Usuario → Componente → Hook (useBooks, useMyReservations, etc.)
                           ↓
                    React Query
                           ↓
                    Axios Instance
                           ↓
                    API Backend
                           ↓
                    Response
                           ↓
                    React Query Cache
                           ↓
                    Componente se actualiza
```

### Optimizaciones de Estado

#### 1. Memoización de Context

```typescript
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
```

Evita re-renders innecesarios cuando el contexto no cambia.

#### 2. Placeholder Data en React Query

```typescript
placeholderData: previousData => previousData
```

Mantiene los datos anteriores visibles mientras se cargan nuevos, mejorando la percepción de velocidad.

#### 3. Stale Time Configurado

```typescript
staleTime: 30_000 // 30 segundos
```

Evita refetches innecesarios mientras los datos siguen siendo válidos.

---

## Arquitectura y Componentes

### Estructura del Proyecto

```
├── components/          # Componentes reutilizables
│   ├── AuthGuard.tsx   # Protección de rutas
│   ├── BookCard.tsx    # Tarjeta de libro
│   ├── Header.tsx      # Encabezado con navegación
│   ├── Layout.tsx      # Layout principal
│   └── Pagination.tsx  # Componente de paginación
├── context/            # Contextos React
│   └── AuthContext.tsx # Contexto de autenticación
├── hooks/              # Hooks personalizados
│   ├── useAuth.ts      # Hook de autenticación
│   ├── useBooks.ts     # Hook de libros
│   ├── useDebounce.ts  # Hook de debounce
│   ├── useLoans.ts     # Hook de préstamos
│   └── useReservations.ts # Hook de reservas
├── lib/                # Utilidades
│   └── api.ts          # Configuración de Axios
├── pages/              # Páginas Next.js
│   ├── _app.tsx        # Configuración global
│   ├── books/          # Páginas de libros
│   ├── admin/          # Panel administrativo
│   ├── my/             # Páginas del usuario
│   ├── login.tsx       # Página de login
│   └── register.tsx    # Página de registro
└── __tests__/          # Pruebas unitarias
```

### Componentes Clave

#### 1. BookCard
Componente para mostrar información resumida de un libro en listados.

#### 2. Pagination
Componente para navegar entre páginas de resultados con controles de anterior/siguiente y números de página.

#### 3. Layout
Wrapper que proporciona estructura consistente (Header + contenido) a todas las páginas.

---

## Conclusión

### Resumen de Implementación

La aplicación BiblioIcesi Frontend implementa exitosamente:

1. **Autenticación robusta**:
   - JWT con persistencia en localStorage
   - Soporte para 2FA/TOTP
   - Validación automática de sesión
   - Manejo de errores y tokens expirados

2. **Autorización basada en roles**:
   - Protección de rutas con AuthGuard
   - Navegación condicional
   - Verificación de permisos en componentes
   - Mensajes de error claros

3. **Gestión de estado eficiente**:
   - Context API para autenticación global
   - React Query para datos remotos con cache
   - Optimizaciones con memoización y debounce
   - Estado reactivo y actualizado

4. **Funcionalidades completas**:
   - CRUD de libros
   - Sistema de reservas
   - Sistema de préstamos
   - Panel administrativo
   - Búsqueda y paginación

### Tecnologías y Patrones Utilizados

- **Next.js 13**: Framework React con SSR/SSG
- **TypeScript**: Tipado estático para mayor seguridad
- **Tailwind CSS**: Estilos utilitarios y responsive
- **React Query**: Gestión de estado de servidor
- **Context API**: Estado global de autenticación
- **Axios**: Cliente HTTP con interceptores
- **JWT**: Tokens para autenticación stateless
