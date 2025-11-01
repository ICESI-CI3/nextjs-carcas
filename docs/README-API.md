# BiblioIcesi API

API REST para la gestión del inventario, reservas y préstamos de la biblioteca. El servidor se construyó con NestJS y expone endpoints bajo el prefijo global `/api`.

## Arquitectura general

- Autenticación mediante JWT, con soporte de segundo factor (TOTP).
- Guardias globales (`JwtAuthGuard`, `RolesGuard`) protegen todos los endpoints salvo los marcados con `@Public()`.
- Base de datos a través de TypeORM con entidades `User`, `Book`, `Copy`, `Reservation` y `Loan`.
- Servicios orquestan reglas de negocio (cupos, expiraciones, multas) y actualizan el estado de las copias.

## Autenticación y seguridad

| Método | Ruta | Público | Descripción |
|--------|------|---------|-------------|
| POST | `/auth/register` | Sí | Registra estudiantes con rol `student`. |
| POST | `/auth/login` | Sí | Valida credenciales y entrega JWT. |
| POST | `/auth/2fa/login` | Sí | Login con contraseña + código TOTP. |
| POST | `/auth/2fa/generate` | No | Genera secreto y QR para activar 2FA. |
| POST | `/auth/2fa/enable` | No | Verifica TOTP y habilita 2FA. |
| POST | `/auth/2fa/disable` | No | Deshabilita 2FA para la cuenta. |

## Usuarios

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/users` | admin | Crear usuarios con cualquier rol. |
| GET | `/users` | admin, librarian | Lista usuarios activos con sus relaciones. |
| GET | `/users/profile` | autenticado | Obtiene el perfil propio. |
| GET | `/users/:id` | admin, librarian | Detalle de un usuario específico. |
| PATCH | `/users/profile` | autenticado | Actualiza datos personales (sin rol). |
| PATCH | `/users/:id` | admin | Modifica datos y rol de otro usuario. |
| DELETE | `/users/:id` | admin | Baja lógica (isActive=false). |

## Libros

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/books` | admin, librarian | Crea un nuevo libro (sin copias). |
| GET | `/books` | público | Lista libros, admite parámetro `search`. |
| GET | `/books/:id` | público | Detalle con copias asociadas. |
| PATCH | `/books/:id` | admin, librarian | Actualiza metadatos del libro. |
| DELETE | `/books/:id` | admin | Elimina el libro. |

## Copias

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/copies` | admin, librarian | Crea una copia ligada a un libro. |
| GET | `/copies` | público | Lista copias y su libro. |
| GET | `/copies/available` | público | Copias cuyo `status=available`. |
| GET | `/copies/:id` | público | Detalle de la copia con relaciones. |
| GET | `/copies/:id/availability` | público | Resumen de disponibilidad y reservas. |
| PATCH | `/copies/:id` | admin, librarian | Actualiza datos (ej. ubicación). |
| PATCH | `/copies/:id/status` | admin, librarian | Fuerza un estado específico. |
| DELETE | `/copies/:id` | admin | Elimina la copia. |

## Reservas

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/reservations` | autenticado | Crea reserva (`pending`) si la copia está libre. |
| GET | `/reservations` | admin, librarian | Lista reservas con usuario y copia. |
| GET | `/reservations/my` | autenticado | Reservas del usuario actual. |
| GET | `/reservations/pending` | admin, librarian | Reservas pendientes globales. |
| GET | `/reservations/:id` | autenticado | Detalle validando propiedad o rol. |
| GET | `/reservations/stats` | admin, librarian | Totales por estado y libro. |
| PATCH | `/reservations/:id/fulfill` | admin, librarian | Marca como `fulfilled` al entregar el libro reservado. |
| PATCH | `/reservations/:id/cancel` | autenticado | Cancelación (usuario propio o staff). |
| POST | `/reservations/expire` | admin | Ejecuta expiración manual de pendientes vencidas. |

**Cupo y estados:** un usuario sólo puede tener 3 reservas pendientes. Las reservas expiran automáticamente mediante un cron que se ejecuta cada hora y libera la copia (`status=available`).

## Préstamos

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/loans` | autenticado (excepto student bloqueado por guardia) | Crea préstamo (`active`). Requiere que la copia esté disponible o reservada por el mismo usuario. Cambia `copy.status` a `borrowed` y fija fecha de devolución en 14 días. |
| GET | `/loans` | admin, librarian | Lista global con usuario y copia. |
| GET | `/loans/my` | autenticado | Préstamos del usuario actual. |
| GET | `/loans/:id` | autenticado | Detalle de préstamo. |
| PATCH | `/loans/:id/return` | admin, librarian | Marca como `returned`, calcula multa (1000 COP/día tardado) y libera la copia. |

**Relación con reservas:** si existe una reserva pendiente para la copia, el préstamo la consume y la marca como `fulfilled` antes de guardar el registro. Sólo el titular de la reserva puede iniciar el préstamo.

## Integración con Google Books

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/google-books/search` | público | Proxy hacia Google Books con query `q`. |
| GET | `/google-books/isbn/:isbn` | público | Busca volumen por ISBN. |
| POST | `/google-books/enrich/:isbn` | admin, librarian | Obtiene metadatos externos y crea/actualiza el libro local. |

## Seed de datos

| Método | Ruta | Público | Descripción |
|--------|------|---------|-------------|
| POST | `/seed` | Sí | Limpia la base y carga usuarios, libros y copias de ejemplo (se usa en pruebas E2E). |

## Ciclo de vida de una copia

1. `available`: estado inicial o tras devolver/cancelar.
2. `reserved`: se crea una reserva pendiente.
3. `borrowed`: se registra un préstamo.
4. Regresa a `available` al devolver el préstamo o expirar/cancelar la reserva.

## Cómo ejecutar el proyecto

```bash
npm install
npm run start:dev
```

Pruebas disponibles:

```bash
npm run test       # unitarias
npm run test:e2e   # end-to-end (requiere base limpia o seed)
npm run test:cov   # cobertura
```

Para más detalles sobre configuración (JWT, base de datos, CRON) revisar los módulos dentro de `src/`.

## CI / CD (GitHub Actions)

Este repositorio incluye dos workflows en `.github/workflows/`:

- `ci.yml` — pipeline de CI que ejecuta las pruebas unitarias y e2e en GitHub Actions.
	- Arranca un servicio Postgres temporal en el runner para que las pruebas e2e se ejecuten contra Postgres (mimicking tu docker-compose local).
	- Variables exposadas en el job: `DB_TYPE=postgres`, `DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_USERNAME=postgres`, `DB_PASSWORD=postgres`, `DB_DATABASE=biblioicesi_test`.
	- Sube el directorio `coverage` como artefacto.

- `deploy-render.yml` — pipeline que se dispara en `push` a `main`:
	- Ejecuta tests (unit + e2e) en el runner.
	- Si los tests pasan y existe el secreto `RENDER_DEPLOY_HOOK`, hace un `POST` a esa URL para activar el Deploy Hook en Render.
	- Nota: el workflow no aprovisiona una base de datos en Render; la base de datos de producción debe estar provisionada y configurada en Render (o en un servicio externo) y sus credenciales expuestas mediante variables de entorno en el servicio de Render.

Importante sobre Classroom y despliegue
- Como el repositorio original está administrado dentro de una Classroom (o una organización con permisos limitados), puede ser complejo crear secrets o configurar hooks directamente en ese repo.
- Para facilitar el despliegue real fui a hacer un fork del repositorio (tu usuario/mi fork) y allí realizaré la configuración y el despliegue automático a Render. En el fork podrás:
	- Añadir `RENDER_DEPLOY_HOOK` como secret en Settings → Secrets and variables → Actions.
	- Configurar los credentials de producción en Render (DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, JWT_SECRET, etc.).
