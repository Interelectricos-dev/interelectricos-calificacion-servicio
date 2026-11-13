# Intereléctricos | Sistema de Calificación de Atención al Cliente

Sistema web corporativo diseñado para la medición, recopilación y análisis de la satisfacción del cliente en puntos de atención presencial (mostradores) mediante códigos QR individuales por asesor.

---

## 1. Resumen Ejecutivo

El sistema permite a los clientes calificar de manera ágil el servicio recibido al finalizar su atención en mostrador. Cada asesor cuenta con un código QR único en su puesto de trabajo que redirige a un formulario móvil optimizado, permitiendo registrar una valoración cuantitativa de 1 a 5 niveles (Rayos de Energía) y comentarios cualitativos opcionales.

La solución incluye un panel administrativo privado para la visualización de indicadores clave de rendimiento (KPIs), gestión de personal en mostrador y generación de material imprimible para puntos de venta.

---

## 2. Arquitectura de Software

El proyecto fue desarrollado bajo una arquitectura desacoplada por capas y orientado al cumplimiento estricto del **Principio de Responsabilidad Única (Single Responsibility Principle - SRP)**.

### 2.1. Estructura de Directorios

```
src/
├── app/                              # Capa de Enrutamiento y Presentación (Next.js App Router)
│   ├── admin/qr/                     # Centro de generación e impresión de fichas QR
│   ├── calificar/                    # Formulario público móvil para clientes
│   ├── layout.tsx                    # Layout raíz, tipografía y metadatos corporativos
│   └── page.tsx                      # Dashboard administrativo protegido por autenticación
│
├── config/                           # Configuración global
│   └── env.ts                        # Validación y lectura centralizada de variables de entorno
│
├── lib/                              # Clientes e integraciones externas
│   └── supabase/
│       └── client.ts                 # Instanciación controlada del cliente Supabase
│
├── modules/                          # Capa de Dominio y Lógica de Negocio
│   ├── asesores/                     # Gestión de personal de atención
│   │   ├── domain/                   # Entidades e interfaces abstractas (IAsesorRepository)
│   │   ├── infrastructure/           # Adaptador de persistencia PostgreSQL / Supabase
│   │   └── services/                 # Casos de uso de asesores y reglas de negocio
│   │
│   ├── calificaciones/               # Gestión de valoraciones y control de fraude
│   │   ├── domain/                   # Entidades, DTOs y reglas de validación de valoraciones
│   │   ├── infrastructure/           # Adaptador de persistencia de calificaciones
│   │   └── services/
│   │       ├── calificacion.service.ts # Orquestación del registro de calificaciones
│   │       └── rate-limiter.service.ts # Control de ventana de tiempo y prevención de duplicados
│   │
│   ├── auth/                         # Seguridad y control de acceso
│   │   └── auth.service.ts           # Autenticación y gestión de sesiones administrativas
│   │
│   └── metricas/                     # Análisis cuantitativo
│       └── metricas.service.ts       # Cálculo de CSAT, promedios y distribución estadística
│
├── components/                       # Componentes reutilizables de interfaz de usuario
│   ├── admin/                        # Formularios y modales de gestión administrativa
│   └── rating/                       # Componentes táctiles interactivos del formulario
│
└── supabase/
    └── schema.sql                    # Definición DDL de base de datos y políticas RLS
```

---

## 3. Principios de Diseño y Decisiones Técnicas

### 3.1. Inversión de Dependencias y Persistencia Desacoplada
Los servicios de negocio consumen abstracciones (`IAsesorRepository`, `ICalificacionRepository`). La infraestructura de persistencia implementa estas interfaces, permitiendo sustituir o actualizar el motor de base de datos sin alterar la lógica de negocio ni la interfaz de usuario.

### 3.2. Prevención de Calificaciones Duplicadas (Cooldown Temporal)
Para equilibrar la facilidad de uso sin requerir autenticación de los clientes presenciales, se implementó un mecanismo de rate limiting basado en identificador anónimo de dispositivo y ventana de tiempo:
* Se registra una marca temporal por asesor en el almacenamiento local del dispositivo.
* Un dispositivo no puede registrar valoraciones consecutivas para el mismo asesor dentro de una ventana de 3 horas (configurable).
* Transcurrido el periodo, el cliente recurrente queda habilitado para registrar futuras atenciones.

### 3.3. Inmutabilidad de Enlaces Físicos (Slug QR)
* El código QR almacena una URL canónica basada en un identificador inmutable (`codigo_slug`).
* La edición de nombres, cargos o correcciones ortográficas de un asesor no altera el identificador del enlace.
* Esto garantiza que el material físico impreso en mostradores mantenga su vigencia operativa indefinidamente.

### 3.4. Política de Eliminación Lógica (Soft Delete)
Para fines de trazabilidad y auditoría interna, los asesores dados de baja no se eliminan físicamente de la base de datos. Su estado cambia a inactivo (`activo = false`), inhabilitando la recepción de nuevas calificaciones pero preservando el histórico estadístico.

### 3.5. Generación Vectorial Local de Códigos QR
La generación de códigos QR se realiza localmente en el navegador mediante renderizado vectorial SVG nativo (`qrcode.react`), eliminando la dependencia de APIs o proveedores externos, garantizando alta resolución de impresión y privacidad de datos.

---

## 4. Modelo de Datos (PostgreSQL / Supabase)

### 4.1. Tabla `asesores`

| Columna | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único del registro |
| `codigo_slug` | VARCHAR(50) | UNIQUE, NOT NULL | Identificador textual inmutable para la URL del QR |
| `nombre` | VARCHAR(120) | NOT NULL | Nombre completo del asesor |
| `cargo` | VARCHAR(100) | DEFAULT 'Asesor Comercial' | Cargo o especialidad |
| `activo` | BOOLEAN | DEFAULT TRUE | Estado operativo (Soft Delete) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha y hora de creación |

### 4.2. Tabla `calificaciones`

| Columna | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único de la calificación |
| `asesor_id` | UUID | REFERENCES asesores(id) ON DELETE CASCADE | Relación con el asesor evaluado |
| `estrellas` | INT | CHECK (estrellas BETWEEN 1 AND 5) | Valoración asignada (1 a 5) |
| `comentario` | TEXT | NULLABLE | Observaciones cualitativas opcionales |
| `device_id` | VARCHAR(100) | NULLABLE | Hash anónimo para control de concurrencia |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Marca de tiempo del registro |

### 4.3. Seguridad a Nivel de Fila (Row Level Security - RLS)
* **Lectura de Asesores:** Pública para permitir el despliegue del nombre y cargo en el formulario del cliente.
* **Inserción de Calificaciones:** Pública para permitir envíos sin fricción por parte de clientes.
* **Gestión Administrativa:** Restringida a operaciones autorizadas del panel.

---

## 5. Variables de Entorno

El archivo `.env.local` debe contener los siguientes parámetros:

```env
# Conexión a Base de Datos (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clave_publica_anonima>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave_publica_anonima>

# Identidad y Reglas de Negocio
NEXT_PUBLIC_COMPANY_NAME=Intereléctricos
NEXT_PUBLIC_RATING_COOLDOWN_HOURS=3

# Credencial de Acceso Administrativo
NEXT_PUBLIC_ADMIN_PIN=<clave_o_pin_de_acceso>
```

---

## 6. Pila Tecnológica

* **Framework:** Next.js (App Router, React Server Components)
* **Lenguaje:** TypeScript (Tipado estricto)
* **Gestor de Paquetes:** pnpm
* **Estilos:** Tailwind CSS v4
* **Base de Datos:** PostgreSQL administrado en Supabase
* **Iconografía:** Lucide React
* **Generación de QR:** qrcode.react (SVG vectorial)
* **Alojamiento:** Vercel (Edge & Serverless Runtime)

---

## 7. Instrucciones de Ejecución Local

### Prerrequisitos
* Node.js LTS (versión 20 o superior)
* pnpm (`npm install -g pnpm`)

### Instalación y Puesta en Marcha

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Interelectricos-dev/interelectricos-calificacion-servicio.git
   cd interelectricos-calificacion-servicio
   ```

2. Instalar dependencias:
   ```bash
   pnpm install
   ```

3. Configurar variables de entorno:
   Copiar `.env.example` a `.env.local` e ingresar las credenciales correspondientes.

4. Iniciar el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

5. Compilar para producción:
   ```bash
   pnpm build
   ```

---

## 8. Rutas de la Aplicación

* `/` — Panel de Control Administrativo (requiere autenticación por PIN/contraseña).
* `/calificar?asesor=<slug>` — Interfaz móvil pública de calificación para clientes.
* `/admin/qr` — Centro de selección e impresión de material físico para mostradores.

---

## 9. Documentación Detallada del Sistema

Para profundizar en la operación y mantenimiento del proyecto, consulte los manuales especializados ubicados en el directorio [`docs/`](docs/):

* [Manual de Usuario](docs/MANUAL_DE_USUARIO.md): Guía de operación, uso del panel administrativo, gestión de asesores, buzón de opiniones e impresión de material QR.
* [Manual Técnico y Arquitectura](docs/MANUAL_TECNICO.md): Arquitectura de software modular (SRP), modelo entidad-relación, reglas de dominio y políticas de seguridad RLS.
* [Guía de Despliegue y Configuración](docs/GUIA_DE_DESPLIEGUE.md): Requisitos de infraestructura, variables de entorno y despliegue continuo en Vercel y Supabase.
* [Historial de Cambios (Changelog)](docs/CHANGELOG.md): Registro cronológico y versionado de auditoría de todas las mejoras y correcciones del sistema.

---

## 10. Mantenimiento y Auditoría

Para auditorías o reportes externos, el panel administrativo incluye exportación completa en formato CSV estándar compatible con hojas de cálculo (Microsoft Excel, Google Sheets). Las marcas de tiempo se registran bajo zona horaria UTC y se renderizan localmente en hora estándar de Colombia (`es-CO`).
