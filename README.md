<!-- Placeholder for documentation -->

<!-- Documentation starts here -->

``` 
 
# BiblioIcesi Frontend

Interfaz web construida con Next.js 13 para consumir la API BiblioIcesi. Permite consultar el catálogo, gestionar reservas y administrar préstamos según el rol del usuario.

## Requisitos previos

- Node.js 18+
- npm 9+
- Endpoint válido de la API (`NEXT_PUBLIC_API_URL`). Por defecto se usa `https://nest-1my6.onrender.com/api`.

## Instalación y Configuración

### Paso 1: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd nextjs-carcas
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=https://nest-1my6.onrender.com/api
```

O si tienes tu propia API:

```env
NEXT_PUBLIC_API_URL=https://tu-backend/api
```

**Nota**: Si no configuras esta variable, la aplicación usará por defecto `https://nest-1my6.onrender.com/api`.

## Ejecución de la Aplicación

### Modo Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Modo Producción

1. Generar el build de producción:
```bash
npm run build
```

2. Iniciar el servidor de producción:
```bash
npm run start
```

## Scripts Disponibles

| comando | descripción |
| --- | --- |
| `npm run dev` | inicia el servidor de desarrollo (`http://localhost:3000`). |
| `npm run build` | genera el paquete de producción. |
| `npm run start` | levanta el build generado. |
| `npm run lint` | ejecuta reglas de ESLint. |
| `npm run test` | corre las pruebas unitarias (Jest). |
| `npm run test:coverage` | ejecuta pruebas con reporte de cobertura. |
| `npm run test:e2e` | ejecuta pruebas end-to-end con Playwright. |

## Funcionalidades principales

- **Autenticación JWT** con soporte opcional de código TOTP (2FA) y persistencia cliente mediante `AuthContext`.
- **Autorización por roles** (`ADMIN`, `LIBRARIAN`, `STUDENT`) controlada con `AuthGuard` y navegación contextual en el encabezado.
- **Catálogo de libros** con búsqueda debounced, paginación (`Pagination`) y enriquecimiento desde Google Books en los formularios de creación/edición.
- **Reservas y préstamos**
	- Usuarios autenticados crean y cancelan reservas desde la ficha del libro y el módulo “Mis reservas”.
	- Personal autorizado registra préstamos y devoluciones desde el panel administrativo o la ficha del libro.
- **Gestión de estado** combinando React Query (datos remotos) y Context API (sesión de usuario).

## Estructura relevante

```
├── components
│   ├── AuthGuard.tsx
│   ├── BookCard.tsx
│   ├── Header.tsx
│   ├── Layout.tsx
│   └── Pagination.tsx
├── context
│   └── AuthContext.tsx
├── hooks
│   ├── useAuth.ts
│   ├── useBooks.ts
│   ├── useDebounce.ts
│   ├── useLoans.ts
│   └── useReservations.ts
├── pages
│   ├── books
│   │   ├── [id].tsx
│   │   ├── [id]/edit.tsx
│   │   ├── create.tsx
│   │   └── index.tsx
│   ├── my
│   │   ├── loans.tsx
│   │   └── reservations.tsx
│   ├── admin/index.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── 403.tsx
│   └── index.tsx
└── __tests__
		├── Pagination.test.tsx
		└── useDebounce.test.tsx
```

## Pruebas

- **Unitarias** con Jest + Testing Library (`npm run test`). Cobertura en componentes reusables y hooks.
- **E2E** con Playwright (`npm run test:e2e`). Requieren la API levantada y preferiblemente `POST /seed` ejecutado.

## CI/CD

Este proyecto incluye pipelines de CI/CD configurados con GitHub Actions que se ejecutan automáticamente:

- **Linting** en cada push y pull request
- **Pruebas unitarias** con reporte de cobertura
- **Build de producción** para verificar que compile correctamente
- **Pruebas E2E** (opcional en pull requests)

Los workflows se encuentran en `.github/workflows/`.

## Guía de Pruebas de Funcionalidades

Esta guía te ayudará a probar cada funcionalidad de la aplicación paso a paso.

### Prerequisitos

Antes de probar, asegúrate de que:
1. La aplicación esté ejecutándose en modo desarrollo (`npm run dev`)
2. La API backend esté disponible y funcionando
3. Tener al menos un usuario de cada rol (ADMIN, LIBRARIAN, STUDENT) creado en la API

### 1. Autenticación

#### 1.1 Registro de Usuario

1. Accede a `http://localhost:3000/register`
2. Completa el formulario con:
   - Email válido
   - Contraseña (mínimo 8 caracteres recomendado)
   - Nombre y apellido (opcional)
3. Haz clic en "Registrarse"
4. **Resultado esperado**: Redirección automática a la página de login

#### 1.2 Inicio de Sesión

1. Accede a `http://localhost:3000/login`
2. Ingresa tus credenciales:
   - Email
   - Contraseña
3. Si tienes 2FA habilitado, se mostrará un campo adicional para el código TOTP
4. Haz clic en "Iniciar sesión"
5. **Resultado esperado**: 
   - Redirección a `/books` (o a la página desde la que intentaste acceder)
   - El header muestra tu email y rol
   - Aparecen los enlaces "Mis reservas" y "Mis préstamos"

#### 1.3 Cerrar Sesión

1. Estando autenticado, haz clic en el botón "Cerrar sesión" en el header
2. **Resultado esperado**: 
   - Redirección a `/login`
   - Los enlaces de usuario desaparecen del header
   - Se muestran los enlaces "Iniciar sesión" y "Registrarme"

### 2. Catálogo de Libros

#### 2.1 Ver Listado de Libros

1. Accede a `http://localhost:3000/books` (o haz clic en "Libros" en el header)
2. **Resultado esperado**: 
   - Se muestra una cuadrícula con tarjetas de libros
   - Cada tarjeta muestra: título, autor (si está disponible), imagen (si está disponible)
   - Se muestra información de paginación en la parte inferior

#### 2.2 Búsqueda de Libros

1. En la página de libros, escribe en el campo de búsqueda (p. ej., "JavaScript")
2. Espera 400ms (debounce automático)
3. **Resultado esperado**: 
   - La lista se actualiza automáticamente con los resultados
   - La URL se actualiza con el parámetro de búsqueda (`?q=JavaScript`)
   - Se muestran solo los libros que coinciden con la búsqueda

#### 2.3 Navegación por Páginas

1. En la página de libros, si hay más de 6 libros, verás controles de paginación
2. Haz clic en "Next" o en un número de página
3. **Resultado esperado**: 
   - La lista se actualiza con los libros de la página seleccionada
   - La URL se actualiza con el parámetro `?page=2`
   - El número de página actual se resalta

#### 2.4 Ver Detalle de un Libro

1. Haz clic en cualquier tarjeta de libro
2. **Resultado esperado**: 
   - Se muestra la página de detalle con información completa
   - Se listan las copias disponibles
   - Aparece un botón "Reservar" si estás autenticado como estudiante
   - Aparecen botones adicionales si eres ADMIN o LIBRARIAN

### 3. Reservas (Rol: STUDENT)

#### 3.1 Crear una Reserva

1. Inicia sesión como estudiante
2. Navega a un libro y haz clic en "Reservar"
3. Confirma la acción si se solicita
4. **Resultado esperado**: 
   - Mensaje de éxito
   - El libro se agrega a "Mis reservas"

#### 3.2 Ver Mis Reservas

1. Haz clic en "Mis reservas" en el header
2. **Resultado esperado**: 
   - Se muestra una lista de todas tus reservas
   - Cada reserva muestra: título del libro, estado, fecha de creación, fecha de expiración
   - Se pueden ver reservas: pendientes, confirmadas, expiradas, canceladas

#### 3.3 Cancelar una Reserva

1. Ve a "Mis reservas"
2. Localiza una reserva activa (pendiente o confirmada)
3. Haz clic en "Cancelar" (si está disponible)
4. Confirma la cancelación
5. **Resultado esperado**: 
   - La reserva desaparece de la lista o cambia a estado "cancelada"
   - Mensaje de confirmación

### 4. Préstamos

#### 4.1 Ver Mis Préstamos (STUDENT)

1. Inicia sesión como estudiante
2. Haz clic en "Mis préstamos" en el header
3. **Resultado esperado**: 
   - Se muestra una lista de tus préstamos activos
   - Cada préstamo muestra: título del libro, fecha de préstamo, fecha de devolución, estado
   - Se muestran multas si aplican

#### 4.2 Gestionar Préstamos (ADMIN/LIBRARIAN)

1. Inicia sesión como ADMIN o LIBRARIAN
2. Accede al panel administrativo (`/admin`)
3. Navega a la sección de préstamos
4. **Resultado esperado**: 
   - Se muestra una lista de todos los préstamos del sistema
   - Puedes filtrar por estado o usuario
   - Opciones para registrar préstamos y devoluciones

### 5. Panel Administrativo (ADMIN/LIBRARIAN)

#### 5.1 Acceder al Panel

1. Inicia sesión como ADMIN o LIBRARIAN
2. Haz clic en "Panel" en el header
3. **Resultado esperado**: 
   - Redirección a `/admin`
   - Dashboard con estadísticas y opciones de gestión

#### 5.2 Gestión de Libros (ADMIN/LIBRARIAN)

**Crear un Libro:**
1. Accede al panel administrativo
2. Haz clic en "Crear Libro" o navega a `/books/create`
3. Completa el formulario:
   - Título (requerido)
   - Autor
   - ISBN (opcional, puede buscar en Google Books)
   - Categorías
   - Imagen (URL)
4. Haz clic en "Crear"
5. **Resultado esperado**: 
   - El libro se crea y aparece en el catálogo
   - Redirección a la página de detalle del nuevo libro

**Editar un Libro:**
1. Navega a un libro existente
2. Haz clic en "Editar" (visible solo para ADMIN/LIBRARIAN)
3. Modifica los campos deseados
4. Haz clic en "Guardar"
5. **Resultado esperado**: 
   - Los cambios se guardan
   - Redirección a la página de detalle con la información actualizada

### 6. Autorización y Roles

#### 6.1 Probar Restricciones por Rol

**Como STUDENT:**
1. Inicia sesión como estudiante
2. Intenta acceder directamente a `/admin`
3. **Resultado esperado**: 
   - Redirección a `/403` (Acceso denegado)
   - Mensaje: "Acceso restringido."

**Como ADMIN/LIBRARIAN:**
1. Inicia sesión como ADMIN o LIBRARIAN
2. Accede a `/admin`
3. **Resultado esperado**: 
   - Acceso permitido
   - Se muestra el panel administrativo completo

#### 6.2 Verificar Navegación Condicional

1. Observa el header según tu rol:
   - **STUDENT**: No aparece "Panel"
   - **ADMIN/LIBRARIAN**: Aparece "Panel"
   - **Todos autenticados**: Aparecen "Mis reservas" y "Mis préstamos"
   - **No autenticados**: Solo aparecen "Iniciar sesión" y "Registrarme"

### 7. Pruebas de Casos Especiales

#### 7.1 Sesión Persistente

1. Inicia sesión
2. Cierra el navegador completamente
3. Abre el navegador nuevamente y accede a `http://localhost:3000`
4. **Resultado esperado**: 
   - Sigues autenticado
   - No necesitas iniciar sesión nuevamente
   - El header muestra tu información

#### 7.2 Token Expirado

1. Inicia sesión
2. Espera a que el token expire o elimina el token manualmente del localStorage
3. Intenta realizar una acción que requiera autenticación
4. **Resultado esperado**: 
   - Redirección automática a `/login`
   - El token se elimina automáticamente

#### 7.3 Búsqueda con Resultados Vacíos

1. Busca un término que no exista en el catálogo (p. ej., "xyz123abc")
2. **Resultado esperado**: 
   - Mensaje indicando que no se encontraron resultados
   - La lista se muestra vacía

#### 7.4 Paginación en Límites

1. Ve a la primera página de resultados
2. Intenta ir a "Anterior"
3. **Resultado esperado**: 
   - El botón "Anterior" está deshabilitado
4. Ve a la última página
5. Intenta ir a "Siguiente"
6. **Resultado esperado**: 
   - El botón "Siguiente" está deshabilitado

## Despliegue

### Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Configura la variable de entorno `NEXT_PUBLIC_API_URL` en la configuración del proyecto
3. Vercel detectará automáticamente Next.js y desplegará la aplicación

### Despliegue en Render

1. Crea un nuevo servicio "Web Service" en Render
2. Conecta tu repositorio
3. Configura:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - Variable de entorno: `NEXT_PUBLIC_API_URL`
4. Render desplegará automáticamente

### Despliegue Manual

1. Configura variables en el servicio destino (`NEXT_PUBLIC_API_URL`)
2. Ejecuta `npm run build`
3. Sirve el resultado con `npm run start` o usa un servidor web como Nginx

## Documentación adicional

- `docs/TallerNext.md`: requerimientos oficiales del taller.
- `docs/InformeFuncionalidades.md`: **informe detallado de funcionalidades, autenticación, autorización y gestión del estado**.
- `docs/DocumentacionPruebas.md`: documentación completa del sistema de pruebas.
- `docs/README-API.md`: guía pública de la API BiblioIcesi.
- `docs/REPORT-API.md`: informe técnico backend.
[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ckVqWxjG)
