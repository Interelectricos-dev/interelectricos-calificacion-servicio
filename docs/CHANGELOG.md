# Historial de Cambios y Registro de Versiones (Changelog)
**Intereléctricos | Sistema de Calificación de Servicio al Cliente**

Todos los cambios notables, mejoras y correcciones realizadas en este proyecto están documentados en este archivo siguiendo los principios de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico formal.

---

## [2.1.0] - 2026-11-13
### Agregado
* **Filtros Avanzados en Buzón (`/buzon`):**
  * Selector para filtrar opiniones por asesor específico.
  * Selectores de fecha nativos con rango configurable (*Desde* y *Hasta*).
  * Contador dinámico en el botón de exportación CSV reflejando la cantidad exacta de registros filtrados.
* **Script de Pruebas Semanal:**
  * Generación de set de datos realista con 54 calificaciones distribuidas en horario laboral continuo (8:00 AM a 5:00 PM) para los 7 asesores activos.
  * Configuración en `.gitignore` para salvaguardar scripts de testing SQL exclusivamente en entorno local.

### Corregido
* **Cálculo de Iniciales en Avatares (`getInitials`):**
  * Corrección en el Dashboard y Buzón para extraer la inicial del primer nombre y la del último apellido (ej. *Francisco Barroso* $\rightarrow$ `FB`, *Cesar Ballesteros* $\rightarrow$ `CB`).

---

## [2.0.0] - 2026-11-13
### Arquitectura y Desacoplamiento
* **Transición de Monolito a Arquitectura Multipágina (Next.js App Router):**
  * Reducción del componente central `page.tsx` de más de 1.000 líneas a 130 líneas altamente legibles y desacopladas.
  * Creación de rutas dedicadas e independientes:
    * `/` — Dashboard Ejecutivo y Analítica Avanzada.
    * `/asesores` — Gestión de Personal de Mostrador y Estados.
    * `/buzon` — Auditoría y Lectura de Opiniones.
    * `/qr` — Centro de Impresión y Selección de Fichas.

### Agregado
* **Dashboard Ejecutivo de Calidad y Analítica Multidimensional:**
  * Motor analítico en memoria (`analitica.service.ts`) con 0 ms de retraso.
  * Barra de filtros combinables por Año, Mes, Asesor y Calificación (1 a 5 Rayos).
  * Gráfico de distribución de calificaciones mediante barras de progreso CSS nativas ultra livianas.
  * Cuadro de tendencias y comportamiento: día de mayor afluencia en tienda, franja horaria pico (mañana, mediodía, tarde) y tasa de comentarios escritos.
  * Ranking de desempeño de asesores (Leaderboard) con medallas institucionales y cálculo individual de CSAT.

### Documentación
* Creación del directorio especializado `docs/`:
  * `docs/MANUAL_DE_USUARIO.md` (Operación, flujo del cliente y gestión administrativa).
  * `docs/MANUAL_TECNICO.md` (Arquitectura por capas, modelo DDL de Supabase y formalización de las 9 reglas de negocio RN-01 a RN-09).
  * `docs/GUIA_DE_DESPLIEGUE.md` (Variables de entorno y despliegue continuo en Vercel).

---

## [1.2.0] - 2026-11-12
### Mejoras de Identidad y Experiencia de Usuario
* **Identidad Visual Corporativa:**
  * Reemplazo e integración del logotipo oficial en alta resolución (1080 × 204 px) de Intereléctricos, renderizado de forma nativa sin fondos ni recortes.
  * Unificación de la paleta de colores corporativa: amarillo eléctrico `#F2E205`, carbón `#111827` y slate oscuro `#020617`.
* **Aislamiento de Impresión de Fichas QR:**
  * Adición de reglas `@media print` para ocultar tablas y elementos de fondo del dashboard al imprimir fichas individuales desde el modal.
  * Corrección del espaciado interno de las fichas para dar mayor protagonismo al código QR sin desbordar el marco de corte.
  * Adición del selector de formato de hoja: *1 Ficha por Hoja (Grande centrada)*, *2 Fichas por Hoja (Horizontal lado a lado)* y *4 Fichas por Hoja (2x2 para adhesivos)*.
* **Seguridad y Control de Pruebas:**
  * Aislamiento del botón de reinicio de formulario bajo el parámetro protegido `&mode=test`.
  * Simplificación del acceso administrativo con validación centralizada mediante `NEXT_PUBLIC_ADMIN_PIN`.

---

## [1.1.0] - 2026-11-12
### Agregado
* **Gestión de Personal en Mostrador:**
  * Modal para edición de nombre y cargo de asesores preservando la inmutabilidad de su código QR (`codigo_slug`).
  * Sistema de retiro operativo y reactivación (*Soft Delete* vía `activo = false/true`) para conservar la trazabilidad histórica de auditoría.
  * Formulario rápido de visualización e impresión de QR individual.

### Corregido
* **Resiliencia de Métricas:**
  * Manejo seguro de estado cero en `metricas.service.ts` para evitar divisiones por cero (`NaN`) cuando la base de datos se encuentra vacía.

---

## [1.0.0] - 2026-11-12
### Versión Inicial de Producción
* **Núcleo y Dominio (Single Responsibility Principle - SRP):**
  * Configuración del cliente Supabase y validación centralizada de entorno (`src/config/env.ts`).
  * Módulo `asesores`: Repositorios desacoplados, interfaces abstractas y generación de slugs normalizados (NFD).
  * Módulo `calificaciones`: Registro de evaluaciones de 1 a 5 rayos, sanitización de comentarios y limitador de frecuencia (*cooldown*) de 3 horas por asesor y dispositivo (`DeviceRateLimiterService`).
  * Formulario móvil táctil para clientes (`/calificar`) con estrellas de energía y confeti reactivo.
  * Panel administrativo inicial protegido por clave con métricas generales y tabla de colaboradores.
  * Esquema relacional PostgreSQL con políticas de seguridad a nivel de fila (Row Level Security - RLS).

