# Manual Técnico y Arquitectura de Software
**Intereléctricos | Sistema de Calificación de Servicio al Cliente**

---

## 1. Visión General de la Arquitectura

El sistema ha sido construido bajo una arquitectura modular por capas desacopladas, adoptando rigurosamente los principios de diseño de software orientado al **Principio de Responsabilidad Única (Single Responsibility Principle - SRP)** y la **Inversión de Dependencias (Dependency Inversion)**.

```
                    ┌─────────────────────────┐
                    │      Capa de UI         │
                    │   Next.js App Router    │
                    │   (Páginas y Modales)   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Capa de Dominio     │
                    │  (Servicios de Negocio) │
                    │ - AsesorService         │
                    │ - CalificacionService   │
                    │ - MetricasService       │
                    │ - RateLimiterService    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Capa de Infraestructura │
                    │    (Repositorios y DB)  │
                    │ - Supabase Client       │
                    │ - PostgreSQL con RLS    │
                    └─────────────────────────┘
```

---

## 2. Pila Tecnológica (Tech Stack)

* **Framework de Aplicación:** Next.js (App Router, Turbopack, React Server Components).
* **Lenguaje:** TypeScript (Configuración estricta con interfaces tipadas de dominio).
* **Gestor de Paquetes:** pnpm.
* **Motor de Estilos:** Tailwind CSS v4 con variables corporativas (`#F2E205`, `#111827`, `#1E293B`).
* **Base de Datos y Persistencia:** PostgreSQL gestionado a través de Supabase.
* **Generación Vectorial de QR:** `qrcode.react` (Renderizado SVG cliente sin dependencias de APIs externas).
* **Librería de Componentes e Íconos:** Lucide React.
* **Plataforma de Despliegue:** Vercel (Edge Network / Serverless Runtime).

---

## 3. Modelo de Datos y Esquema DDL

El esquema se encuentra versionado en `supabase/schema.sql`.

### 3.1. Tabla `asesores`
Almacena el catálogo de personal de atención presencial.

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Identificador universal único |
| `nombre` | VARCHAR(150) | NOT NULL | Nombre y apellidos del colaborador |
| `codigo_slug` | VARCHAR(100) | UNIQUE, NOT NULL | Slug inmutable para la URL del código QR |
| `cargo` | VARCHAR(100) | NULLABLE | Denominación del cargo o rol operativo |
| `activo` | BOOLEAN | DEFAULT TRUE | Estado operativo (Soft Delete) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Marca temporal de creación |

### 3.2. Tabla `calificaciones`
Almacena las evaluaciones individuales emitidas por los clientes.

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Identificador universal único |
| `asesor_id` | UUID | REFERENCES asesores(id) ON DELETE CASCADE | Relación foránea con el asesor |
| `estrellas` | INTEGER | CHECK (`estrellas BETWEEN 1 AND 5`) | Puntuación otorgada (1 a 5 rayos) |
| `comentario` | TEXT | NULLABLE | Texto de retroalimentación (máx. 500) |
| `device_id` | VARCHAR(100) | NULLABLE | Hash anónimo de control de concurrencia |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Marca temporal de la calificación |

### 3.3. Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS)

* **Lectura de Asesores:** Acceso público de solo lectura (`SELECT`) para resolver la carga del formulario móvil del cliente mediante el `codigo_slug`.
* **Inserción de Calificaciones:** Acceso público de solo inserción (`INSERT`) garantizando que los clientes puedan emitir su evaluación sin requerir sesiones ni fricción.
* **Operaciones Administrativas:** Modificaciones y creaciones de asesores orquestadas a través de los adaptadores de servicio.

---

## 4. Módulos de Dominio (SRP)

### 4.1. Módulo `asesores` (`src/modules/asesores/`)
* **`domain/asesor.entity.ts`:** Entidad pura de negocio y tipos DTO (`CreateAsesorDTO`, `UpdateAsesorDTO`).
* **`domain/asesor.repository.ts`:** Interfaz abstracta `IAsesorRepository` que desacopla la lógica de negocio de la base de datos subyacente.
* **`infrastructure/supabase-asesor.repository.ts`:** Implementación concreta que mapea operaciones contra Supabase.
* **`services/asesor.service.ts`:** Servicio que aplica reglas de normalización de cadenas, generación de slugs seguros y sanitización de datos.

### 4.2. Módulo `calificaciones` (`src/modules/calificaciones/`)
* **`domain/calificacion.entity.ts`:** Entidad y reglas de validación (escala numérica del 1 al 5).
* **`services/calificacion.service.ts`:** Orquesta la inserción y delega la verificación al limitador de frecuencia.
* **`services/rate-limiter.service.ts`:** Controla la ventana de enfriamiento (*cooldown*) de 3 horas por asesor mediante almacenamiento local en dispositivo (`localStorage`) y asignación de identificador anónimo persistente.

### 4.3. Módulo `metricas` (`src/modules/metricas/`)
* **`services/metricas.service.ts`:** Cálculos de:
  * CSAT: $\frac{\text{Calificaciones de 4 y 5 rayos}}{\text{Total de calificaciones}} \times 100$
  * Promedio de atención por asesor y consolidado general.
  * Agrupaciones estadísticas con soporte de estado cero (cuando no existen registros).

### 4.4. Módulo `auth` (`src/modules/auth/`)
* **`services/auth.service.ts`:** Validación y gestión de la sesión administrativa contra la variable de entorno protegida `NEXT_PUBLIC_ADMIN_PIN`, soportando tanto claves numéricas como contraseñas alfanuméricas.

---

## 5. Reglas de Negocio del Sistema (Business Rules)

Para garantizar la integridad y coherencia funcional, el sistema implementa explícitamente las siguientes reglas de negocio:

### RN-01: Generación y Desambiguación de Slugs
* Al registrar un asesor, el sistema normaliza su nombre (convierte a minúsculas, elimina tildes y caracteres especiales mediante NFD y reemplaza espacios por guiones).
* **Colisión de Nombres:** Si el slug generado ya existe en la base de datos (ej. un homónimo *Carlos Gómez*), el sistema anexa automáticamente un sufijo numérico aleatorio (`carlos-gomez-42`) para garantizar unicidad sin requerir intervención manual.

### RN-02: Inmutabilidad del Identificador QR
* El campo `codigo_slug` es estrictamente inmutable durante las operaciones de actualización (`updateAsesor`). Modificar el nombre comercial o el cargo de un asesor jamás alterará su slug, preservando la validez de las fichas impresas físicas en el punto de venta.

### RN-03: Restricción Cuantitativa de Calificación
* La valoración de servicio debe ser obligatoriamente un número entero comprendido entre 1 y 5 (escala de 1 a 5 Rayos de Energía). No se admiten valores nulos, decimales ni valores fuera de este rango (`CHECK (estrellas BETWEEN 1 AND 5)`).

### RN-04: Sanitización y Límite de Comentarios
* El campo de comentario es estrictamente opcional.
* Si el cliente proporciona texto, este es saneado eliminando espacios vacíos en los extremos (*trim*). Si el texto resultante tiene longitud cero, se persiste como `NULL`.
* La longitud máxima admitida es de **500 caracteres**. Cualquier texto que exceda dicho límite es truncado automáticamente antes de la persistencia.

### RN-05: Control de Frecuencia y Prevención de Duplicados (Cooldown)
* El sistema implementa una ventana de enfriamiento (*cooldown*) predeterminada de **3 horas (180 minutos)** por asesor (`NEXT_PUBLIC_RATING_COOLDOWN_HOURS`).
* **Alcance por Asesor:** El bloqueo es específico por colaborador evaluado. Un cliente no puede calificar al mismo asesor dos veces en menos de 3 horas, pero sí puede calificar a otro asesor diferente en el mismo día si fue atendido en otro mostrador.
* **Identificación del Dispositivo:** Se genera un hash anónimo persistente (`ie_device_fingerprint`) en el navegador del cliente que se almacena junto con cada calificación (`device_id`).

### RN-06: Aislamiento del Modo de Prueba
* El botón de reinicio y desbloqueo de pruebas solo es visible y funcional cuando la URL incluye el parámetro explícito `&mode=test`. Los clientes que escanean códigos QR físicos nunca tienen acceso a este parámetro ni pueden omitir el cooldown.

### RN-07: Cálculo e Interpretación del CSAT y Estado Cero
* El indicador de Satisfacción Neta (CSAT) se calcula como la proporción porcentual de calificaciones de **4 y 5 rayos** sobre el total de valoraciones emitidas.
* **Tolerancia a Estado Cero:** Si no existen calificaciones registradas, el sistema devuelve `0.0` en promedio y `0%` en CSAT, previniendo divisiones por cero (`NaN`) tanto en el cliente como en el servidor.

### RN-08: Conservación Histórica y Desactivación (Soft Delete)
* Está prohibida la eliminación física de registros de asesores en la base de datos.
* Los asesores desvinculados pasan a estado inactivo (`activo = false`). Esto deshabilita inmediatamente su código QR para recibir nuevas calificaciones, manteniendo intactos todos los registros históricos de evaluaciones y comentarios para auditorías gerenciales.

### RN-09: Normalización y Zona Horaria de Auditoría
* Todas las marcas de tiempo se registran en la base de datos bajo estándar universal UTC (`TIMESTAMPTZ`).
* En las interfaces de usuario (Dashboard y Buzón) y en la exportación a CSV, las fechas se transforman y formatean en la zona horaria legal de Colombia (`es-CO`, UTC-5).

---

## 6. Principios de Seguridad y Resiliencia

1. **Inmutabilidad del Código QR:**  
   El campo `codigo_slug` generado al crear el asesor es inmutable. Si el nombre o cargo de un asesor se corrige o actualiza, la URL física impresa continúa funcionando sin requerir reimpresión.
2. **Generación Vectorial Client-Side:**  
   Los códigos QR se generan mediante SVG vectorial en el navegador del cliente con `qrcode.react`. No se realizan llamadas a APIs externas de terceros, garantizando privacidad, disponibilidad sin cuotas y nitidez al imprimir.
3. **Aislamiento de Medios de Impresión:**  
   Reglas `@media print` en `globals.css` que garantizan que el cuadro de diálogo de impresión solo renderice la ficha de corte correspondiente, bloqueando fondos, encabezados y tablas del dashboard.
4. **Modo Test Exclusivo Administrativo:**  
   Los botones de prueba de calificación en el panel administrativo añaden el parámetro `&mode=test`. Solo bajo este parámetro se permite reiniciar el formulario, impidiendo que clientes regulares puedan abusar del botón de reseteo.

