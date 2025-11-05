# Documentación de Pruebas

## Índice
1. [Introducción](#introducción)
2. [Configuración de Pruebas](#configuración-de-pruebas)
3. [Estructura de Pruebas](#estructura-de-pruebas)
4. [Suites de Pruebas](#suites-de-pruebas)
5. [Mocks y Utilidades](#mocks-y-utilidades)
6. [Ejecución de Pruebas](#ejecución-de-pruebas)
7. [Cobertura de Código](#cobertura-de-código)

---

## Introducción

Este proyecto implementa un conjunto completo de pruebas unitarias para garantizar la calidad y funcionalidad del código. Las pruebas cubren componentes React, hooks personalizados, contexto de autenticación, y utilidades de la aplicación.

### Estadísticas
- **Total de suites de prueba**: 17
- **Total de pruebas**: 99
- **Cobertura mínima requerida**: 80% (líneas, funciones, branches, statements)

---

## Configuración de Pruebas

### Tecnologías Utilizadas

- **Jest**: Framework de pruebas principal
- **React Testing Library**: Para pruebas de componentes React
- **ts-jest**: Transpilador TypeScript para Jest
- **jest-environment-jsdom**: Entorno de pruebas para simular el DOM del navegador
- **@testing-library/jest-dom**: Matchers personalizados para Jest

### Archivo de Configuración

La configuración se encuentra en `jest.config.js` y define:

- **Entorno**: jsdom (simula navegador)
- **Transformación**: TypeScript/TSX a JavaScript
- **Cobertura**: Componentes, hooks y contextos
- **Mocks**: Next.js router y Link
- **Umbral de cobertura**: 80% en todas las métricas

---

## Estructura de Pruebas

Las pruebas se organizan en el directorio `__tests__/` con la siguiente estructura:

```
__tests__/
├── api.test.ts                    # Pruebas de configuración de API
├── AuthContext.test.tsx          # Pruebas del contexto de autenticación
├── AuthGuard.test.tsx            # Pruebas del componente de protección de rutas
├── BookCard.test.tsx             # Pruebas del componente de tarjeta de libro
├── Header.test.tsx               # Pruebas del componente de encabezado
├── Layout.test.tsx               # Pruebas del componente de layout
├── Pagination.test.tsx           # Pruebas básicas de paginación
├── Pagination.enhanced.test.tsx  # Pruebas avanzadas de paginación
├── useAuth.test.tsx              # Pruebas del hook de autenticación
├── useBooks.test.tsx             # Pruebas básicas del hook de libros
├── useBooks.enhanced.test.tsx    # Pruebas avanzadas del hook de libros
├── useDebounce.test.tsx          # Pruebas básicas del hook de debounce
├── useDebounce.enhanced.test.tsx # Pruebas avanzadas del hook de debounce
├── useLoans.test.tsx             # Pruebas del hook de préstamos
├── useReservations.test.tsx      # Pruebas del hook de reservas
├── useUsers.test.tsx             # Pruebas básicas del hook de usuarios
└── useUsers.enhanced.test.tsx    # Pruebas avanzadas del hook de usuarios
```

---

## Suites de Pruebas

### 1. `api.test.ts` - Configuración de API

**Propósito**: Verificar la configuración correcta de la instancia de Axios.

**Pruebas**:
- Configuración de instancia con baseURL
- Configuración de interceptor de solicitudes para agregar token
- Configuración de interceptor de respuestas para manejar errores 401
- Manejo de baseURL que termina con `/api`

**Características clave**:
- Verifica que `axios.create` se llame correctamente
- Valida la configuración de headers
- Prueba la adición automática de tokens de autenticación
- Verifica la eliminación de tokens en caso de error 401

---

### 2. `AuthContext.test.tsx` - Contexto de Autenticación

**Propósito**: Probar la funcionalidad completa del contexto de autenticación.

**Pruebas principales**:
- Inicialización del contexto sin token
- Inicialización del contexto con token válido
- Inicialización del contexto con token inválido
- Función de login
- Función de registro
- Función de logout
- Función de refreshProfile
- Función hasRole para verificación de roles
- Manejo de roles (ADMIN, LIBRARIAN, STUDENT)
- Persistencia de tokens en localStorage

**Casos especiales**:
- Manejo de errores de red
- Limpieza de tokens expirados
- Verificación de roles case-insensitive

---

### 3. `AuthGuard.test.tsx` - Protección de Rutas

**Propósito**: Verificar que el componente AuthGuard protege correctamente las rutas.

**Pruebas principales**:
- Muestra estado de carga durante inicialización
- Muestra fallback personalizado de carga
- Redirige a login cuando no está autenticado
- Permite acceso cuando no requiere autenticación
- Permite acceso cuando está autenticado
- Redirige a 403 cuando el usuario carece de rol requerido
- Permite acceso cuando el usuario tiene el rol requerido
- Usa ruta de redirección personalizada
- Muestra fallback personalizado cuando se deniega acceso
- Muestra mensaje por defecto cuando se deniega acceso
- Manejo de coincidencia de roles case-insensitive

**Características**:
- Soporte para múltiples roles
- Redirección inteligente con parámetros de consulta
- Mensajes personalizables de error

---

### 4. `Header.test.tsx` - Componente de Encabezado

**Propósito**: Verificar la renderización correcta del encabezado según el estado de autenticación.

**Pruebas principales**:
- Renderiza logo y enlaces de navegación
- Muestra enlaces de login y registro cuando no está autenticado
- Muestra enlaces de usuario cuando está autenticado
- Muestra enlace de panel administrativo para rol ADMIN
- Muestra enlace de panel administrativo para rol LIBRARIAN
- No muestra enlace de panel para rol STUDENT
- Muestra email y rol del usuario
- Muestra "Usuario" cuando el rol es undefined
- Muestra estado de carga durante inicialización

**Características**:
- Renderizado condicional basado en roles
- Integración con contexto de autenticación
- Manejo de estados de carga

---

### 5. `Layout.test.tsx` - Componente de Layout

**Propósito**: Verificar que el layout renderiza correctamente sus hijos y el header.

**Pruebas**:
- Renderiza hijos correctamente
- Renderiza componente Header

**Características**:
- Integración con AuthProvider para soportar Header
- Estructura básica de layout

---

### 6. `BookCard.test.tsx` - Tarjeta de Libro

**Propósito**: Verificar la renderización correcta de las tarjetas de libros.

**Pruebas**:
- Renderiza información básica del libro
- Muestra imagen cuando está disponible
- Muestra información de autor
- Maneja libros sin imagen

---

### 7. `Pagination.test.tsx` - Componente de Paginación

**Propósito**: Probar la funcionalidad básica de paginación.

**Pruebas**:
- Renderiza controles de paginación
- Navegación entre páginas
- Deshabilitación de botones en límites

---

### 8. `Pagination.enhanced.test.tsx` - Paginación Avanzada

**Propósito**: Pruebas exhaustivas del componente de paginación.

**Pruebas adicionales**:
- Manejo de múltiples páginas
- Cálculo correcto de páginas totales
- Estados de botones (habilitado/deshabilitado)
- Llamadas a callbacks de cambio de página

---

### 9. `useAuth.test.tsx` - Hook de Autenticación

**Propósito**: Verificar el hook personalizado que encapsula la lógica de autenticación.

**Pruebas**:
- Proporciona funciones de login y logout
- Integración con router de Next.js
- Redirección después de login/logout
- Acceso al contexto de autenticación

---

### 10. `useBooks.test.tsx` - Hook de Libros (Básico)

**Propósito**: Pruebas básicas del hook para obtener libros.

**Pruebas**:
- Obtiene libros con paginación
- Maneja parámetros de búsqueda
- Recorta espacios en búsqueda
- Maneja formato de respuesta de array
- Maneja formato de respuesta con propiedad data
- Maneja respuesta con propiedad total
- Maneja búsqueda vacía
- Usa valores por defecto de paginación

---

### 11. `useBooks.enhanced.test.tsx` - Hook de Libros (Avanzado)

**Propósito**: Pruebas avanzadas y casos edge del hook de libros.

**Pruebas adicionales**:
- Manejo de respuestas con metadatos incompletos
- Validación de tipos de datos
- Manejo de errores de red
- Caché y actualización de datos

---

### 12. `useDebounce.test.tsx` - Hook de Debounce (Básico)

**Propósito**: Verificar el comportamiento básico del hook de debounce.

**Pruebas**:
- Retrasa la actualización del valor
- Cancela actualizaciones rápidas
- Actualiza después del tiempo de espera

---

### 13. `useDebounce.enhanced.test.tsx` - Hook de Debounce (Avanzado)

**Propósito**: Pruebas exhaustivas del hook de debounce.

**Pruebas adicionales**:
- Manejo de diferentes tiempos de espera
- Limpieza de timers
- Múltiples actualizaciones rápidas
- Integración con React Query

---

### 14. `useLoans.test.tsx` - Hook de Préstamos

**Propósito**: Verificar el hook para gestionar préstamos de libros.

**Pruebas**:
- Obtiene lista de préstamos
- Maneja paginación
- Filtrado y búsqueda
- Manejo de errores

---

### 15. `useReservations.test.tsx` - Hook de Reservas

**Propósito**: Verificar el hook para gestionar reservas de libros.

**Pruebas**:
- Obtiene lista de reservas
- Maneja paginación
- Creación de reservas
- Cancelación de reservas

---

### 16. `useUsers.test.tsx` - Hook de Usuarios (Básico)

**Propósito**: Pruebas básicas del hook para obtener usuarios.

**Pruebas**:
- Obtiene lista de usuarios
- Maneja paginación
- Búsqueda de usuarios
- Filtrado por rol

---

### 17. `useUsers.enhanced.test.tsx` - Hook de Usuarios (Avanzado)

**Propósito**: Pruebas avanzadas del hook de usuarios.

**Pruebas adicionales**:
- Maneja formato de respuesta de array
- Maneja respuesta con propiedad data
- Maneja parámetros de búsqueda múltiples
- Recorta espacios en búsqueda
- Maneja respuestas con metadatos faltantes
- Maneja respuesta con propiedad items
- Maneja búsqueda vacía
- Fallback de data.items

---

## Ejecución de Pruebas

### Comandos Disponibles

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas unitarias
npm run test:unit

# Ejecutar pruebas con cobertura
npm run test:coverage

# Ejecutar pruebas E2E
npm run test:e2e
```

## Cobertura de Código

### Configuración de Cobertura

El proyecto requiere un mínimo de 80% de cobertura en:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%
