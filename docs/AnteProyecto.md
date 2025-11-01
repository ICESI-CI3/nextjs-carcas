**Propuesta de anteproyecto
Proyecto: BiblioIcesi
Integrantes:**
● Santiago Cárdenas – A
● Alejandro Castro – A
**Nombre y descripción del proyecto
Nombre:** BiblioIcesi
**Descripción del problema y público objetivo:**
Actualmente, muchas bibliotecas académicas y clubes de lectura gestionan sus
inventarios y préstamos mediante hojas de cálculo. Esta práctica genera duplicidad
de información, escasa trazabilidad y retrasos al registrar nuevos títulos.
BiblioIcesi busca centralizar el catálogo de libros, agilizar el proceso de préstamos y
devoluciones, y enriquecer automáticamente los metadatos (autor, portada, sinopsis,
ISBN) consultando la API de Google Books.
**Público objetivo:** Bibliotecarios y lectores (estudiantes, docentes y comunidad
académica).
**Objetivos terminales (OT):**
● **OT1:** Gestionar el catálogo y ejemplares con trazabilidad e integridad de
datos.
● **OT2:** Agilizar el flujo de préstamos y devoluciones mediante reglas de
negocio claras.
● **OT3:** Generar reportes (uso, moras, libros más prestados) exportables a PDF.
● **OT4:** Implementar autenticación y autorización basada en roles para
operaciones sensibles.
● **OT5:** Integrar metadatos externos desde Google Books para enriquecer el
catálogo.


**Autenticación de usuarios
Método:** JWT (Bearer Token).
**Roles definidos:**
● **ADMIN (Bibliotecario):** CRUD de libros y ejemplares, gestión de préstamos
y devoluciones, administración de usuarios y generación/exportación de
reportes.
● **USER (Lector):** Búsqueda de libros, solicitud de préstamos, consulta de
historial y gestión de reservas.
**Matriz de permisos (resumen):**
● **USER:** acceso a búsqueda de libros, detalle, solicitud de préstamo, historial
personal y reservas.
● **ADMIN:** incluye los permisos de USER, más operaciones avanzadas sobre
libros, ejemplares, préstamos, devoluciones, reservas, usuarios y reportes.
**Endpoints de autenticación:**
● **POST /auth/register** – registro de lector.
● **POST /auth/login** – obtención de JWT.
● **GET /me** – perfil del usuario autenticado.
**Módulo de catálogo
Entidades:**
● **Book:** define título, autor, editorial, año, ISBN, categoría.
● **Copy:** ejemplares físicos asociados a un libro, con código único y estado
(disponible, prestado, dañado).
● **Category** : clasifica los libros por temática.


**Reglas de negocio clave:**
● Un libro puede tener múltiples ejemplares (copias).
● Un ejemplar solo puede estar en un estado a la vez.
● La categoría organiza el catálogo para mejorar la búsqueda.
**CRUD:**
● **Book** : crear, listar, ver detalle, actualizar, eliminar.
● **Copy** : crear, listar, ver detalle, actualizar estado, eliminar.
● **Category** : crear, listar, ver detalle, actualizar, eliminar.
**Endpoints principales:
● POST /books** – registrar libro.
**● GET /books** – listar libros.
**● GET /books/:id** – detalle de libro.
**● PUT /books/:id** – actualizar libro.
**● DELETE /books/:id** – eliminar libro.
**● POST /copies** – registrar copia.
**● PUT /copies/:id** – actualizar estado de copia.
**● POST /categories** – crear categoría.
**● GET /categories** – listar categorías.
**Justificación técnica** : Un catálogo estructurado optimiza la consulta de información
y garantiza control sobre la disponibilidad de ejemplares.


**Módulo de préstamos y reservas
Entidades:**
● **Loan** : define préstamos con fechas de inicio, vencimiento, devolución y
estado.
● **Reservation** : solicitudes de reserva de un libro cuando no hay ejemplares
disponibles.
**Reglas de negocio clave:**
● Todo préstamo inicia con fecha actual y vence en 14 días.
● Al devolver un ejemplar se registra la fecha y se recalcula mora si aplica.
● Una reserva activa se convierte en préstamo al cumplirse, quedando
marcada como FULFILLED.
**CRUD:**
● **Loan:** crear, listar, ver detalle, actualizar estado, eliminar (opcional).
● **Reservation:** crear, listar, ver detalle, actualizar estado, eliminar.
**Endpoints principales:**
● **POST /loans** – crear préstamo.
● **PATCH /loans/:id/return** – registrar devolución.
● **GET /loans** – listar préstamos.
● **POST /reservations** – crear reserva.
● **PATCH /reservations/:id/fulfill** – cumplir reserva.
● **GET /reservations** – listar reservas.
**Justificación técnica:** Las reglas automatizadas reducen errores manuales y
aseguran consistencia en el flujo de préstamos y reservas


**Módulo de usuarios
Entidades:**
● **Usuario** : contiene datos básicos (nombre, apellido, correo, contraseña
encriptada, estado).
● **Rol** : agrupa permisos y define el nivel de acceso.
● **Permiso** : define acciones específicas que pueden asignarse a los roles.
**Reglas de negocio clave:**
● Un usuario debe tener al menos un rol asignado.
● Los roles definen los permisos de acceso al sistema.
● Un usuario inactivo no puede autenticarse ni realizar operaciones.
**CRUD:**
● **Usuarios:** crear, listar, ver detalle, actualizar datos/estado, eliminar (baja
lógica).
● **Roles:** crear, listar, ver detalle, actualizar, eliminar.
● **Permisos:** crear, listar, ver detalle, actualizar, eliminar.
**Endpoints principales:**
● **POST /usuarios** – crear usuario.
● **GET /usuarios** – listar usuarios.
● **GET /usuarios/:id** – ver detalle usuario.
● **PUT /usuarios/:id** – actualizar usuario.
● **DELETE /usuarios/:id** – eliminar usuario.
● **PUT /usuarios/:id/estado** – cambiar estado.


● **POST /usuarios/:id/roles/:idRol** – asignar rol a usuario.
● **DELETE /usuarios/:id/roles/:idRol** – revocar rol a usuario.
● **POST /roles** – crear rol.
● **GET /roles** – listar roles.
● **POST /permisos** – crear permiso.
● **GET /permisos** – listar permisos.
**Justificación técnica:** Centralizar la gestión de usuarios, roles y permisos asegura
seguridad y trazabilidad en el acceso al sistema.
**Módulo de reportes
Entidades:**
● **Reporte** : unidad lógica generada a partir de consultas (no siempre
persistida).
○ tipo_reporte
○ fecha_inicio / fecha_fin
○ formato_salida
○ contenido
**Tipos de reportes generados:**
● Reporte de **actividad de usuarios** (número de préstamos, reservas
realizadas).
● Reporte de **top libros prestados** en un rango de fechas.
● Reporte de **devoluciones tardías** y cálculo de moras.
● Reporte de **uso del sistema** (usuarios activos, endpoints más consultados).


**Formatos de salida:**
● **Gráficos** (barras, tortas, líneas).
● **Tablas** interactivas en el dashboard.
● **PDF** para descarga oficial.
● **JSON** para integraciones con otros sistemas.
**Operaciones CRUD y endpoints principales:**
● **GET /reportes/top-libros?fecha_inicio=...&fecha_fin=...** – top libros
prestados
● **GET /reportes/devoluciones-tardias?fecha_inicio=...&fecha_fin=...** –
devoluciones tardías
● **GET /reportes/actividad-usuarios?fecha_inicio=...&fecha_fin=...** –
actividad de usuarios
● **GET /reportes/uso-sistema?fecha_inicio=...&fecha_fin=...** – uso del
sistema
● **GET /reportes/{tipo}/export/pdf?fecha_inicio=...&fecha_fin=...** – exportar
a PDF
**Justificación técnica:** La variedad de formatos y consultas ofrece a los
administradores herramientas de análisis flexibles, mejorando la toma de decisiones
y la transparencia del sistema.
**API externa – Google Books
API seleccionada:** Google Books API.
**Descripción general:**
El sistema BiblioIcesi se integrará con Google Books API para enriquecer la
información bibliográfica disponible en la plataforma. De esta manera, al registrar o
consultar un libro, se podrá acceder automáticamente a datos externos como título,
autores, editorial, portada y sinopsis.


**Datos enviados:**
● isbn: número estándar internacional del libro.
● title: título del libro (en caso de búsqueda por título).
● author: autor del libro (en caso de búsqueda por autor).
**Datos recibidos:**
● title: título oficial del libro.
● authors: lista de autores.
● publisher: editorial.
● publishedDate: fecha de publicación.
● description: resumen o sinopsis.
● pageCount: número de páginas.
● categories: categorías o géneros literarios.
● imageLinks: URLs de portadas disponibles (thumbnail, small, large).
● language: idioma de publicación.
**Endpoints internos expuestos:**
● **GET /external/books/search?query=** → consulta un libro en Google Books
a partir de título, autor o ISBN.
● **GET /external/books/:isbn** → obtiene la información detallada de un libro
usando su ISBN.
● **POST /external/books/import/:isbn** → importa los datos de Google Books al
catálogo interno de BiblioIcesi.
**Justificación técnica:**
La integración con Google Books garantiza acceso a información bibliográfica
actualizada y estandarizada sin necesidad de registrar manualmente todos los


detalles. Esto reduce el trabajo administrativo, mejora la calidad de los datos en el
sistema y ofrece una mejor experiencia al usuario al mostrar portadas, descripciones
y metadatos enriquecidos.
**Decisiones técnicas**
● **Backend:** Node.js.
● **Base de datos:** PostgreSQL para consistencia en datos relacionales.
● **Autenticación:** JWT.
● **Generación de PDF:** Puppeteer o PDFKit.
● **Validaciones clave:** ISBN único, no permitir préstamo si el ejemplar no está
disponible, cálculo automático de mora.
Estas decisiones se fundamentan en la necesidad de escalabilidad, compatibilidad
con entornos académicos y soporte a largo plazo.


**Diagrama de casos de uso de contexto
Búsqueda de libros**


**Solicitar préstamo de libros**


**Consultar préstamo de libros**


**Realizar reserva de libros**


**Generar reportes**


**Registrar libro**


**Actualizar libro**


**Registrar devolución**


