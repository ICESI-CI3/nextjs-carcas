<!-- Placeholder for documentation -->

<!-- Documentation starts here -->

``` 
 
# BiblioIcesi Frontend

Interfaz web construida con Next.js 13 para consumir la API BiblioIcesi. Permite consultar el catálogo, gestionar reservas y administrar préstamos según el rol del usuario.

## Requisitos previos

- Node.js 18+
- npm 9+
- Endpoint válido de la API (`NEXT_PUBLIC_API_URL`). Por defecto se usa `https://nest-1my6.onrender.com/api`.

## Configuración

Instala dependencias y define las variables necesarias.

```bash
npm install
```

Variables de entorno (`.env.local`):

```env
NEXT_PUBLIC_API_URL=https://tu-backend/api
```

## Scripts útiles

| comando | descripción |
| --- | --- |
| `npm run dev` | inicia el servidor de desarrollo (`http://localhost:3000`). |
| `npm run build` | genera el paquete de producción. |
| `npm run start` | levanta el build generado. |
| `npm run lint` | ejecuta reglas de ESLint. |
| `npm run test` | corre las pruebas unitarias (Jest). |
| `npm run test:e2e` | ejecuta Playwright (requiere API activa con datos seed). |

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

Los workflows se encuentran en `.github/workflows/`. Para más información, consulta [docs/CI_CD.md](docs/CI_CD.md).

## Despliegue

1. Configura variables en el servicio destino (`NEXT_PUBLIC_API_URL`).
2. Ejecuta `npm run build` y sirve el resultado con `npm run start` o despliega en Vercel/Render.

## Documentación adicional

- `docs/TallerNext.md`: requerimientos oficiales del taller.
- `docs/INFORME_FUNCIONALIDADES.md`: **informe detallado de funcionalidades, autenticación, autorización y gestión del estado**.
- `docs/DocumentacionPruebas.md`: documentación completa del sistema de pruebas.
- `docs/README-API.md`: guía pública de la API BiblioIcesi.
- `docs/REPORT-API.md`: informe técnico backend.
[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ckVqWxjG)
